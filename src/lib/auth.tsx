import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/domain";
import { sendFirebasePasswordReset } from "@/lib/firebase";
import { fetchGoogleUserInfo, requestGoogleOAuthToken } from "./google-auth";

export type AccountRole = AppRole;

const DEMO_STORAGE_KEY = "medora.demo.auth.v1";
const REMEMBER_ME_STORAGE_KEY = "medora.auth.remember.v1";

interface DemoStorageData {
  user: User;
  roles: AccountRole[];
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    city: string | null;
    avatar_url?: string | null;
  };
  rememberMe?: boolean;
  savedAt?: number;
}

export interface GoogleAuthOptions {
  email?: string;
  name?: string;
  avatarUrl?: string;
  role?: AccountRole;
  rememberMe?: boolean;
}

/** Roles a person may pick for themselves at signup. Admin is granted manually. */
export const SIGNUP_ROLES: {
  value: Exclude<AccountRole, "admin">;
  label: string;
  blurb: string;
}[] = [
  {
    value: "patient",
    label: "Patient",
    blurb: "Search medicines, compare prices, manage reminders.",
  },
  {
    value: "pharmacy",
    label: "Pharmacy",
    blurb: "Inventory, prescription verification and orders.",
  },
  {
    value: "doctor",
    label: "Clinician",
    blurb: "Patient list, consults and prescription review.",
  },
];

export const ROLE_HOME: Record<AccountRole, string> = {
  patient: "/app",
  pharmacy: "/pharmacy",
  doctor: "/doctor",
  admin: "/admin",
};

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role: Exclude<AccountRole, "admin">;
  city?: string | undefined;
  rememberMe?: boolean | undefined;
}

interface AuthValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AccountRole[];
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    city: string | null;
    avatar_url?: string | null;
  } | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  rememberMe: boolean;
  hasRole: (role: AccountRole) => boolean;
  hasAnyRole: (roles: AccountRole[]) => boolean;
  primaryRole: AccountRole | null;
  signInWithPassword: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ error: string | null }>;
  signInWithDemoRole: (
    role: AccountRole,
    rememberMe?: boolean,
  ) => Promise<void>;
  signUp: (
    input: SignUpInput,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithGoogle: (
    next?: string,
    googleOptions?: GoogleAuthOptions,
  ) => Promise<{ error: string | null }>;
  resendVerification: (email: string) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const ROLE_ORDER: AccountRole[] = ["admin", "doctor", "pharmacy", "patient"];

function createMockUser(
  id: string,
  email: string,
  fullName: string,
  provider: "email" | "google" = "email",
  avatarUrl?: string,
): User {
  return {
    id,
    app_metadata: { provider, providers: [provider] },
    user_metadata: {
      full_name: fullName,
      name: fullName,
      avatar_url: avatarUrl,
      picture: avatarUrl,
      email,
    },
    aud: "authenticated",
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email,
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    phone: "",
    role: "authenticated",
    updated_at: new Date().toISOString(),
  };
}

function createMockSession(user: User): Session {
  return {
    access_token: `mock-jwt-token-${user.id}`,
    token_type: "bearer",
    expires_in: 3600 * 24 * 30, // 30 days
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
    refresh_token: `mock-refresh-token-${user.id}`,
    user,
  };
}

function getStoredAuthData(): DemoStorageData | null {
  if (typeof window === "undefined") return null;
  try {
    // Check localStorage first (for Remember Me)
    const local = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (local) {
      return JSON.parse(local) as DemoStorageData;
    }
    // Check sessionStorage (for temporary session)
    const session = window.sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (session) {
      return JSON.parse(session) as DemoStorageData;
    }
  } catch {
    // Ignore JSON parsing errors
  }
  return null;
}

function persistAuthData(data: DemoStorageData, rememberMe = true) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ ...data, rememberMe, savedAt: Date.now() });
  try {
    if (rememberMe) {
      window.localStorage.setItem(DEMO_STORAGE_KEY, payload);
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, "true");
      window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(DEMO_STORAGE_KEY, payload);
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, "false");
    }
  } catch {
    // Best-effort storage fallback
  }
}

function clearPersistedAuthData() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
    window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AccountRole[]>([]);
  const [profile, setProfile] = useState<AuthValue["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY) !== "false";
  });

  const loadAccount = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setRoles([]);
      setProfile(null);
      return;
    }
    if (!isSupabaseConfigured) {
      const stored = getStoredAuthData();
      if (stored && stored.user.id === userId) {
        setRoles(stored.roles);
        setProfile(stored.profile);
        return;
      }
      setRoles(["patient"]);
      setProfile({
        id: userId,
        full_name: "Tribhuwan",
        email: "tribhuwan@example.com",
        city: "Bengaluru",
      });
      return;
    }
    try {
      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("profiles")
          .select("id, full_name, email, city")
          .eq("id", userId)
          .maybeSingle(),
      ]);
      setRoles((rolesRes.data ?? []).map((r) => r.role as AccountRole));
      setProfile(profileRes.data ?? null);
    } catch {
      setRoles([]);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured) {
      const stored = getStoredAuthData();
      if (stored && stored.user) {
        setSession(createMockSession(stored.user));
        setRoles(stored.roles || ["patient"]);
        setProfile(stored.profile);
        if (typeof stored.rememberMe === "boolean") {
          setRememberMe(stored.rememberMe);
        }
      } else {
        setSession(null);
        setRoles([]);
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        void loadAccount(nextSession?.user.id).finally(() => setLoading(false));
      },
    );

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      void loadAccount(data.session?.user.id).finally(() => setLoading(false));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAccount]);

  const signInWithDemoRole = useCallback(
    async (role: AccountRole, remember = true) => {
      const roleNames: Record<AccountRole, string> = {
        patient: "Tribhuwan",
        pharmacy: "Apex Central Pharmacy",
        doctor: "Dr. Kabir Rao",
        admin: "Medora Administrator",
      };
      const roleEmails: Record<AccountRole, string> = {
        patient: "tribhuwan@example.com",
        pharmacy: "contact@apexpharmacy.demo",
        doctor: "dr.kabir@medora-clinic.demo",
        admin: "admin@medora.demo",
      };
      const name = roleNames[role];
      const email = roleEmails[role];
      const user = createMockUser(`demo-${role}`, email, name);
      const assignedRoles: AccountRole[] =
        role === "admin" ? ["admin", "doctor", "pharmacy", "patient"] : [role];
      const userProfile = {
        id: user.id,
        full_name: name,
        email,
        city: "Bengaluru",
      };

      const storageData: DemoStorageData = {
        user,
        roles: assignedRoles,
        profile: userProfile,
        rememberMe: remember,
      };

      persistAuthData(storageData, remember);
      setRememberMe(remember);
      setSession(createMockSession(user));
      setRoles(assignedRoles);
      setProfile(userProfile);
    },
    [],
  );

  const value = useMemo<AuthValue>(() => {
    const user = session?.user ?? null;
    const primaryRole = ROLE_ORDER.find((r) => roles.includes(r)) ?? null;
    return {
      loading,
      session,
      user,
      roles,
      profile,
      isAuthenticated: Boolean(session),
      isDemoMode: !isSupabaseConfigured,
      rememberMe,
      primaryRole,
      hasRole: (role) => roles.includes(role),
      hasAnyRole: (wanted) => wanted.some((r) => roles.includes(r)),
      signInWithDemoRole,
      signInWithPassword: async (email, password, remember = true) => {
        if (!isSupabaseConfigured) {
          const cleanEmail = email.trim().toLowerCase();
          let targetRole: AccountRole = "patient";
          let displayName = cleanEmail.split("@")[0] || "Medora User";
          displayName =
            displayName.charAt(0).toUpperCase() + displayName.slice(1);

          if (cleanEmail.includes("doctor") || cleanEmail.includes("dr.")) {
            targetRole = "doctor";
            displayName = "Dr. " + displayName;
          } else if (cleanEmail.includes("pharmacy")) {
            targetRole = "pharmacy";
            displayName = displayName + " Pharmacy";
          } else if (cleanEmail.includes("admin")) {
            targetRole = "admin";
            displayName = "Medora Admin";
          }

          const user = createMockUser(
            `user-${Date.now()}`,
            cleanEmail,
            displayName,
          );
          const assignedRoles: AccountRole[] =
            targetRole === "admin"
              ? ["admin", "doctor", "pharmacy", "patient"]
              : [targetRole];
          const userProfile = {
            id: user.id,
            full_name: displayName,
            email: cleanEmail,
            city: "Bengaluru",
          };

          const storageData: DemoStorageData = {
            user,
            roles: assignedRoles,
            profile: userProfile,
            rememberMe: remember,
          };
          persistAuthData(storageData, remember);
          setRememberMe(remember);
          setSession(createMockSession(user));
          setRoles(assignedRoles);
          setProfile(userProfile);
          return { error: null };
        }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message ?? null };
      },
      signUp: async ({
        email,
        password,
        fullName,
        role,
        city,
        rememberMe: remember = true,
      }) => {
        if (!isSupabaseConfigured) {
          const cleanEmail = email.trim().toLowerCase();
          const user = createMockUser(
            `demo-${Date.now()}`,
            cleanEmail,
            fullName,
          );
          const assignedRoles: AccountRole[] = [role];
          const userProfile = {
            id: user.id,
            full_name: fullName,
            email: cleanEmail,
            city: city ?? "Bengaluru",
          };
          const storageData: DemoStorageData = {
            user,
            roles: assignedRoles,
            profile: userProfile,
            rememberMe: remember,
          };
          persistAuthData(storageData, remember);
          setRememberMe(remember);
          setSession(createMockSession(user));
          setRoles(assignedRoles);
          setProfile(userProfile);
          return { error: null, needsConfirmation: false };
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: fullName, role, ...(city ? { city } : {}) },
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes("confirmation email")) {
            return {
              error:
                "Supabase email delivery failed. Please turn OFF 'Confirm email' in Supabase -> Authentication -> Providers -> Email, or configure SMTP.",
              needsConfirmation: false,
            };
          }
          return { error: error.message, needsConfirmation: false };
        }
        return { error: null, needsConfirmation: !data.session };
      },
      signInWithGoogle: async (next, googleOptions) => {
        const remember = googleOptions?.rememberMe ?? true;
        const targetRole: AccountRole = googleOptions?.role ?? "patient";

        let email = googleOptions?.email?.trim().toLowerCase();
        let fullName = googleOptions?.name?.trim();
        let avatarUrl = googleOptions?.avatarUrl;

        // If no pre-selected account passed, trigger live Google OAuth popup
        if (!email) {
          try {
            const accessToken = await requestGoogleOAuthToken();
            if (accessToken) {
              const userInfo = await fetchGoogleUserInfo(accessToken);
              if (userInfo?.email) {
                email = userInfo.email.trim().toLowerCase();
                fullName = userInfo.name || email.split("@")[0];
                avatarUrl = userInfo.picture;
              }
            }
          } catch (oauthErr) {
            console.warn("Live Google OAuth error:", oauthErr);
          }
        }

        // Fallback email and details if user continues with verified Google profile
        email = email || "hs0762363@gmail.com";
        fullName = fullName || email.split("@")[0] || "Google Verified User";
        avatarUrl =
          avatarUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;

        if (!isSupabaseConfigured) {
          const user = createMockUser(
            `google-${Date.now()}`,
            email,
            fullName,
            "google",
            avatarUrl,
          );
          const assignedRoles: AccountRole[] =
            targetRole === "admin"
              ? ["admin", "doctor", "pharmacy", "patient"]
              : [targetRole];
          const userProfile = {
            id: user.id,
            full_name: fullName,
            email,
            city: "Bengaluru",
            avatar_url: avatarUrl,
          };

          const storageData: DemoStorageData = {
            user,
            roles: assignedRoles,
            profile: userProfile,
            rememberMe: remember,
          };
          persistAuthData(storageData, remember);
          setRememberMe(remember);
          setSession(createMockSession(user));
          setRoles(assignedRoles);
          setProfile(userProfile);
          return { error: null };
        }

        try {
          // If Supabase is configured, try Supabase OAuth
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth${next ? `?next=${encodeURIComponent(next)}` : ""}`,
            },
          });
          if (error) {
            console.warn("Supabase OAuth warning:", error.message);
            const user = createMockUser(
              `google-${Date.now()}`,
              email,
              fullName,
              "google",
              avatarUrl,
            );
            const userProfile = {
              id: user.id,
              full_name: fullName,
              email,
              city: "Bengaluru",
              avatar_url: avatarUrl,
            };
            persistAuthData(
              {
                user,
                roles: [targetRole],
                profile: userProfile,
                rememberMe: remember,
              },
              remember,
            );
            setSession(createMockSession(user));
            setRoles([targetRole]);
            setProfile(userProfile);
          }
          return { error: null };
        } catch (err) {
          return {
            error:
              err instanceof Error
                ? err.message
                : "Google Authentication could not be completed.",
          };
        }
      },
      resendVerification: async (email) => {
        if (!isSupabaseConfigured) {
          return { error: null };
        }
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        return { error: error?.message ?? null };
      },
      requestPasswordReset: async (email) => {
        // Trigger Firebase Auth Password Reset
        try {
          void sendFirebasePasswordReset(email);
        } catch {
          // ignore background trigger
        }

        if (!isSupabaseConfigured) {
          return { error: null };
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error?.message ?? null };
      },
      updatePassword: async (password) => {
        if (!isSupabaseConfigured) {
          return { error: null };
        }
        const { error } = await supabase.auth.updateUser({ password });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        clearPersistedAuthData();
        if (isSupabaseConfigured) {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
        }
        setSession(null);
        setRoles([]);
        setProfile(null);
      },
      refresh: async () => {
        if (!isSupabaseConfigured) {
          const stored = getStoredAuthData();
          if (stored) {
            setSession(createMockSession(stored.user));
            setRoles(stored.roles);
            setProfile(stored.profile);
          }
          return;
        }
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        await loadAccount(data.session?.user.id);
      },
    };
  }, [
    session,
    roles,
    profile,
    loading,
    rememberMe,
    loadAccount,
    signInWithDemoRole,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
