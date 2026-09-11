/**
 * Google OAuth 2.0 & Google Sign-In helper functions using Google Identity Services (GSI).
 * Supports Real Google Authentication, user info fetching, and Google Workspace Scopes.
 */
import firebaseConfig from "../../firebase-applet-config.json";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://mail.google.com/",
];

const TOKEN_STORAGE_KEY = "medora_google_oauth_token";
const CLIENT_ID_STORAGE_KEY = "medora_custom_google_client_id";

export interface GoogleAuthToken {
  accessToken: string;
  expiresAt: number;
  scopes: string[];
}

export interface GoogleUserProfile {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified?: boolean;
}

export function getGoogleClientId(): string {
  const custom = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (custom && custom.trim().length > 0) return custom.trim();

  // Priority 1: Vite Environment Variable from .env
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.["VITE_GOOGLE_CLIENT_ID"] &&
    import.meta.env["VITE_GOOGLE_CLIENT_ID"].trim().length > 0
  ) {
    return import.meta.env["VITE_GOOGLE_CLIENT_ID"].trim();
  }

  // Priority 2: Firebase Applet config
  if (
    firebaseConfig?.oAuthClientId &&
    firebaseConfig.oAuthClientId.trim().length > 0
  ) {
    return firebaseConfig.oAuthClientId.trim();
  }

  // Priority 3: Fallback client ID
  return "252833058087-10ct0ofql7amsuu7dkl6r6ii2s12kbq9.apps.googleusercontent.com";
}

export function setStoredGoogleClientId(id: string) {
  if (!id) {
    localStorage.removeItem(CLIENT_ID_STORAGE_KEY);
  } else {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, id.trim());
  }
}

export function getStoredGoogleToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const token: GoogleAuthToken = JSON.parse(raw);
    if (Date.now() > token.expiresAt - 60000) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    return token.accessToken;
  } catch {
    return null;
  }
}

export function saveGoogleToken(accessToken: string, expiresInSeconds = 3599) {
  const token: GoogleAuthToken = {
    accessToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
    scopes: GOOGLE_SCOPES,
  };
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
}

export function clearGoogleToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function loadGoogleIdentityScript(): Promise<boolean> {
  const win = window as unknown as {
    google?: {
      accounts?: {
        id?: unknown;
        oauth2?: unknown;
      };
    };
  };
  if (win.google?.accounts?.id || win.google?.accounts?.oauth2) {
    return true;
  }

  return new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      setTimeout(() => resolve(true), 1500);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Decode standard Google JWT credential token
 */
export function decodeGoogleJwt(credential: string): GoogleUserProfile | null {
  try {
    const parts = credential.split(".");
    const part1 = parts[1];
    if (!part1) return null;
    const payload = part1.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch (err) {
    console.error("Failed to decode Google JWT:", err);
    return null;
  }
}

/**
 * Fetch Google user profile using an access token
 */
export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch Google profile: ${res.status} ${res.statusText}`,
    );
  }
  return await res.json();
}

/**
 * Request OAuth Access Token with custom or default scopes
 */
export async function requestGoogleOAuthToken(
  scopes?: string[],
  clientIdOverride?: string,
): Promise<string> {
  const existing = getStoredGoogleToken();
  if (existing) return existing;

  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(
        new Error(
          "Google Identity Services client is not available. Please try refreshing.",
        ),
      );
      return;
    }

    const clientId =
      clientIdOverride && clientIdOverride.trim().length > 0
        ? clientIdOverride.trim()
        : getGoogleClientId();

    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: (scopes || GOOGLE_SCOPES).join(" "),
      callback: (response: {
        access_token?: string;
        expires_in?: number;
        error?: string;
      }) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        if (response.access_token) {
          saveGoogleToken(response.access_token, response.expires_in ?? 3599);
          resolve(response.access_token);
        } else {
          reject(new Error("No access token returned from Google."));
        }
      },
      error_callback: (err: unknown) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    });

    client.requestAccessToken();
  });
}

/**
 * Alias for workspace compatibility
 */
export const requestGoogleAccessToken = requestGoogleOAuthToken;
