import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ROLE_HOME, SIGNUP_ROLES, useAuth, type AccountRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Auth3DHeroVisual,
  ROLE_HERO_DATA,
  RoleSelectionCard3D,
} from "@/components/auth/Auth3DVisuals";
import { GoogleAuthModal } from "@/components/auth/GoogleAuthModal";

function safeNext(value: unknown): string {
  if (typeof value !== "string") return "";
  if (!value.startsWith("/") || value.startsWith("//")) return "";
  if (value.startsWith("/auth")) return "";
  return value;
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    next: safeNext(search["next"]),
  }),
  head: () => ({
    meta: [
      { title: "Authentication — Medora Healthcare Intelligence" },
      {
        name: "description",
        content:
          "Sign in or register for your Medora workspace as a patient, licensed pharmacy, or clinician.",
      },
      { property: "og:title", content: "Medora Healthcare Intelligence Auth" },
      {
        property: "og:description",
        content:
          "Role-based healthcare portal for patients, pharmacies, and clinicians.",
      },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "roles" | "signup" | "forgot" | "verify" | "otp";

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)", flag: "🇮🇳" },
  { code: "+1", label: "USA (+1)", flag: "🇺🇸" },
  { code: "+44", label: "UK (+44)", flag: "🇬🇧" },
  { code: "+971", label: "UAE (+971)", flag: "🇦🇪" },
  { code: "+65", label: "Singapore (+65)", flag: "🇸🇬" },
  { code: "+61", label: "Australia (+61)", flag: "🇦🇺" },
];

const CLINICAL_SPECIALITIES = [
  "General Medicine",
  "Cardiology",
  "Diabetology & Endocrinology",
  "Pediatrics",
  "Dermatology",
  "Orthopedics",
  "Pulmonology",
  "Gastroenterology",
];

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Strong", "Excellent"];

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const auth = useAuth();

  // Mode & Step state
  const [mode, setMode] = useState<AuthMode>("signin");
  const [step, setStep] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<AccountRole>("patient");

  // Common input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [city, setCity] = useState("Bengaluru");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Patient-specific
  const [fullName, setFullName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Pharmacy-specific
  const [pharmacyName, setPharmacyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [operatingHours, setOperatingHours] = useState("8:00 AM - 10:00 PM");

  // Doctor-specific
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [speciality, setSpeciality] = useState(CLINICAL_SPECIALITIES[0]);

  // Captcha for Login (as requested in screenshot 4)
  const [captchaNum1, setCaptchaNum1] = useState(2);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Status & dialog states
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Refresh captcha generator
  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 1;
    const n2 = Math.floor(Math.random() * 8) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaAnswer("");
    setCaptchaVerified(false);
  };

  useEffect(() => {
    refreshCaptcha();
  }, [mode]);

  // Handle captcha input validation
  const handleCaptchaChange = (val: string) => {
    setCaptchaAnswer(val);
    if (parseInt(val.trim(), 10) === captchaNum1 + captchaNum2) {
      setCaptchaVerified(true);
      setError(null);
    } else {
      setCaptchaVerified(false);
    }
  };

  const strength = useMemo(() => passwordScore(password), [password]);

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8,
      mixedCase: /[A-Z]/.test(password) && /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  // Already signed in redirect
  useEffect(() => {
    if (auth.loading || !auth.isAuthenticated) return;
    const destination = next || ROLE_HOME[auth.primaryRole ?? "patient"];
    void navigate({ to: destination as "/app", replace: true });
  }, [auth.loading, auth.isAuthenticated, auth.primaryRole, next, navigate]);

  function switchMode(nextMode: AuthMode) {
    setError(null);
    setNotice(null);
    setMode(nextMode);
    setStep(1);
  }

  const handleRoleSelect = (roleKey: "patient" | "pharmacy" | "doctor") => {
    setSelectedRole(roleKey);
    setStep(1);
    setMode("signup");
    setError(null);
  };

  async function resend() {
    setError(null);
    setNotice(null);
    setBusy(true);
    const { error: err } = await auth.resendVerification(pendingEmail);
    setBusy(false);
    if (err) return setError(err);
    setCooldown(45);
    setNotice("Verification email sent. Check your inbox and spam folder.");
  }

  // Handle step progression for signup
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (selectedRole === "patient" && (!fullName.trim() || !email.trim())) {
        setError("Please provide your full name and valid email address.");
        return;
      }
      if (
        selectedRole === "pharmacy" &&
        (!pharmacyName.trim() ||
          !ownerName.trim() ||
          !licenseNumber.trim() ||
          !email.trim())
      ) {
        setError(
          "Please fill in the pharmacy name, owner name, drug license number, and email.",
        );
        return;
      }
      if (
        selectedRole === "doctor" &&
        (!doctorName.trim() || !doctorRegNo.trim() || !email.trim())
      ) {
        setError(
          "Please enter clinician name, medical registration number, and email.",
        );
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!city.trim()) {
        setError("Please specify your city / operational location.");
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      void handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to Medora's terms of verification.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    const computedName =
      selectedRole === "patient"
        ? fullName
        : selectedRole === "pharmacy"
          ? `${ownerName} (${pharmacyName})`
          : `Dr. ${doctorName}`;

    const { error: err, needsConfirmation } = await auth.signUp({
      email,
      password,
      fullName: computedName,
      role: selectedRole === "admin" ? "patient" : selectedRole,
      city: city || undefined,
      rememberMe,
    });

    setBusy(false);
    if (err) return setError(err);

    if (needsConfirmation) {
      setPendingEmail(email);
      setPassword("");
      setCooldown(45);
      setMode("verify");
      toast.success("Account created! Please verify your email.");
    } else {
      toast.success("Welcome to Medora! Redirecting to your workspace...");
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    // Optional captcha verification check on production login
    if (
      captchaAnswer.trim() &&
      parseInt(captchaAnswer.trim(), 10) !== captchaNum1 + captchaNum2
    ) {
      setError(
        `Captcha verification incorrect. What is ${captchaNum1} + ${captchaNum2}?`,
      );
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    const { error: err } = await auth.signInWithPassword(
      email,
      password,
      rememberMe,
    );
    setBusy(false);
    if (err) return setError(err);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await auth.requestPasswordReset(email);
    setBusy(false);
    if (err) return setError(err);
    setNotice(
      "If that email has a Medora account, a secure reset link has been dispatched.",
    );
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address to receive a secure OTP.");
      return;
    }
    setBusy(true);
    setError(null);
    // Simulate or send OTP
    setTimeout(() => {
      setBusy(false);
      setNotice(
        `Single-use access code dispatched to ${email}. Check your inbox.`,
      );
      setCooldown(60);
    }, 800);
  };

  // Step names for current role
  const stepTitles = useMemo(() => {
    if (selectedRole === "pharmacy") {
      return [
        { num: 1, title: "Business Info" },
        { num: 2, title: "Dispensary Location" },
        { num: 3, title: "Account Security" },
      ];
    }
    if (selectedRole === "doctor") {
      return [
        { num: 1, title: "Clinical Info" },
        { num: 2, title: "Practice & Speciality" },
        { num: 3, title: "Account Security" },
      ];
    }
    return [
      { num: 1, title: "Personal Info" },
      { num: 2, title: "Address & Location" },
      { num: 3, title: "Security & Credentials" },
    ];
  }, [selectedRole]);

  return (
    <main className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <GoogleAuthModal
        open={googleModalOpen}
        onOpenChange={setGoogleModalOpen}
        next={next || undefined}
        defaultRole={selectedRole}
      />

      {/* TOP BRAND NAVIGATION BAR */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-md lg:px-12">
        <Link
          to="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground sm:flex">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          {mode !== "signin" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchMode("signin")}
              className="text-xs font-bold"
            >
              Sign In
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => switchMode("roles")}
              className="text-xs font-bold"
            >
              Create Account
            </Button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* VIEW 1: ROLE SELECTION SCREEN (As depicted in Reference Image 1) */}
        {mode === "roles" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-4xl py-6 sm:py-12"
          >
            <div className="mb-10 text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-extrabold tracking-wider uppercase text-primary">
                <Sparkles className="size-3.5" />
                <span>Medora 3D Healthcare Suite</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
                Create your account
              </h1>
              <p className="text-base text-muted-foreground max-w-md mx-auto">
                How will you be using Medora? Choose your workspace to access
                specialized clinical tools.
              </p>
            </div>

            {/* 3D Role Selection Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <RoleSelectionCard3D
                roleKey="patient"
                title="I'm a Patient"
                description="Find prescribed medicines, upload prescriptions, compare genuine pharmacy prices, and track orders."
                icon={User}
                badge="Patient Hub"
                selected={selectedRole === "patient"}
                onClick={() => handleRoleSelect("patient")}
              />

              <RoleSelectionCard3D
                roleKey="pharmacy"
                title="I'm a Pharmacy"
                description="Manage dispensary inventory, process digital prescriptions, and access AI-powered demand forecasting."
                icon={Building2}
                badge="Dispensary Deck"
                selected={selectedRole === "pharmacy"}
                onClick={() => handleRoleSelect("pharmacy")}
              />

              <RoleSelectionCard3D
                roleKey="doctor"
                title="I'm a Clinician"
                description="Digital prescription authoring, zero-latency drug-drug interaction checks, and clinical decision support."
                icon={Stethoscope}
                badge="Clinician Desk"
                selected={selectedRole === "doctor"}
                onClick={() => handleRoleSelect("doctor")}
              />
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="font-extrabold text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: MULTI-STEP SIGNUP & SIGNIN 2-COLUMN LAYOUT (As depicted in Images 2, 3, 4) */}
        {mode !== "roles" && (
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12 items-start py-4">
            {/* LEFT 3D HERO PANEL */}
            <div className="hidden lg:block lg:sticky lg:top-24">
              <Auth3DHeroVisual
                role={selectedRole}
                currentStep={step}
                totalSteps={3}
                stepTitle={stepTitles[step - 1]?.title}
                isLogin={
                  mode === "signin" || mode === "forgot" || mode === "otp"
                }
              />
            </div>

            {/* RIGHT FORM CONTAINER */}
            <div className="w-full max-w-xl mx-auto rounded-3xl border-2 border-border/80 bg-card p-6 sm:p-9 shadow-lg backdrop-blur-sm">
              {/* Top Navigation / Breadcrumb */}
              <div className="mb-6 flex items-center justify-between">
                {mode === "signup" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step > 1) {
                        setStep((s) => s - 1);
                        setError(null);
                      } else {
                        switchMode("roles");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="size-3.5 text-primary" />
                    {step > 1 ? "Previous Step" : "Change Role"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="size-3.5 text-primary" />
                    Back to Sign In
                  </button>
                )}

                {/* Role Pill Display */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {selectedRole === "patient" && <User className="size-3.5" />}
                  {selectedRole === "pharmacy" && (
                    <Building2 className="size-3.5" />
                  )}
                  {selectedRole === "doctor" && (
                    <Stethoscope className="size-3.5" />
                  )}
                  <span className="capitalize">{selectedRole} Mode</span>
                </div>
              </div>

              {/* STEP PROGRESS BREADCRUMB (Reference Image 2 & 3) */}
              {mode === "signup" && (
                <div className="mb-8 border-b border-border pb-6">
                  <div className="flex items-center justify-between">
                    {stepTitles.map((st, idx) => {
                      const isActive = step === st.num;
                      const isDone = step > st.num;
                      return (
                        <div key={st.num} className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs"
                                : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {isDone ? (
                              <Check className="size-3.5 stroke-[3]" />
                            ) : (
                              st.num
                            )}
                          </div>
                          <span
                            className={cn(
                              "hidden sm:inline text-xs font-bold transition-colors",
                              isActive
                                ? "text-ink"
                                : isDone
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/60",
                            )}
                          >
                            {st.title}
                          </span>
                          {idx < stepTitles.length - 1 && (
                            <span className="h-0.5 w-6 sm:w-10 bg-border mx-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ----------------- MODE: SIGN UP (3 STEPS) ----------------- */}
              {mode === "signup" && (
                <form onSubmit={handleNextStep} className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                      {stepTitles[step - 1]?.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {step === 1 &&
                        `Tell us about ${selectedRole === "pharmacy" ? "your pharmacy enterprise" : selectedRole === "doctor" ? "your medical practice" : "yourself"}.`}
                      {step === 2 &&
                        "Enter your location & verification details."}
                      {step === 3 &&
                        "Secure your account credentials and finish onboarding."}
                    </p>
                  </div>

                  {/* STEP 1 FIELDS */}
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4 pt-2"
                    >
                      {/* Patient Step 1 */}
                      {selectedRole === "patient" && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="fullName"
                              className="text-xs font-bold text-foreground"
                            >
                              Full Name{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="fullName"
                                required
                                placeholder="Aria Sharma"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="h-11 border-2 pl-9 text-xs sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="email"
                              className="text-xs font-bold text-foreground"
                            >
                              Email Address{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="email"
                                type="email"
                                required
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 border-2 pl-9 text-xs sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="phone"
                              className="text-xs font-bold text-foreground"
                            >
                              Phone Number
                            </Label>
                            <div className="grid grid-cols-[110px_1fr] gap-2">
                              <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="h-11 rounded-lg border-2 border-input bg-background px-2 text-xs font-semibold"
                              >
                                {COUNTRY_CODES.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.flag} {c.code}
                                  </option>
                                ))}
                              </select>
                              <div className="relative">
                                <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  id="phone"
                                  type="tel"
                                  placeholder="98765 43210"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="h-11 border-2 pl-9 text-xs sm:text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pharmacy Step 1 */}
                      {selectedRole === "pharmacy" && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="pharmacyName"
                              className="text-xs font-bold text-foreground"
                            >
                              Pharmacy / Business Name{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Building2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="pharmacyName"
                                required
                                placeholder="Apex Care Pharmacy"
                                value={pharmacyName}
                                onChange={(e) =>
                                  setPharmacyName(e.target.value)
                                }
                                className="h-11 border-2 pl-9 text-xs sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor="ownerName"
                                className="text-xs font-bold text-foreground"
                              >
                                Owner / Pharmacist Name{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="ownerName"
                                required
                                placeholder="Vikram Patel"
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                                className="h-11 border-2 text-xs sm:text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor="licenseNumber"
                                className="text-xs font-bold text-foreground"
                              >
                                Drug License No. (DL){" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="licenseNumber"
                                required
                                placeholder="DL-KA-2024-8891"
                                value={licenseNumber}
                                onChange={(e) =>
                                  setLicenseNumber(e.target.value)
                                }
                                className="h-11 border-2 font-mono text-xs sm:text-sm uppercase"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="email"
                              className="text-xs font-bold text-foreground"
                            >
                              Business Email Address{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="email"
                                type="email"
                                required
                                placeholder="dispensary@apexpharmacy.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 border-2 pl-9 text-xs sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="phone"
                              className="text-xs font-bold text-foreground"
                            >
                              Business Contact Phone
                            </Label>
                            <div className="grid grid-cols-[110px_1fr] gap-2">
                              <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="h-11 rounded-lg border-2 border-input bg-background px-2 text-xs font-semibold"
                              >
                                {COUNTRY_CODES.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.flag} {c.code}
                                  </option>
                                ))}
                              </select>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="080 4492 8810"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="h-11 border-2 text-xs sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Doctor Step 1 */}
                      {selectedRole === "doctor" && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="doctorName"
                              className="text-xs font-bold text-foreground"
                            >
                              Clinician Full Name{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Stethoscope className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="doctorName"
                                required
                                placeholder="Dr. Rajesh Menon"
                                value={doctorName}
                                onChange={(e) => setDoctorName(e.target.value)}
                                className="h-11 border-2 pl-9 text-xs sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor="doctorRegNo"
                                className="text-xs font-bold text-foreground"
                              >
                                Medical Reg. Number (MCI/NMC){" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="doctorRegNo"
                                required
                                placeholder="MCI-64920-K"
                                value={doctorRegNo}
                                onChange={(e) => setDoctorRegNo(e.target.value)}
                                className="h-11 border-2 font-mono text-xs sm:text-sm uppercase"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor="hospitalName"
                                className="text-xs font-bold text-foreground"
                              >
                                Primary Hospital / Clinic
                              </Label>
                              <Input
                                id="hospitalName"
                                placeholder="Fortis / Aster CMI"
                                value={hospitalName}
                                onChange={(e) =>
                                  setHospitalName(e.target.value)
                                }
                                className="h-11 border-2 text-xs sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="email"
                              className="text-xs font-bold text-foreground"
                            >
                              Professional Email{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="email"
                                type="email"
                                required
                                placeholder="dr.menon@hospital.org"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 border-2 pl-9 text-xs sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 2 FIELDS */}
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="city"
                          className="text-xs font-bold text-foreground"
                        >
                          City / Operational Hub{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="city"
                            required
                            placeholder="Bengaluru"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-11 border-2 pl-9 text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="address"
                          className="text-xs font-bold text-foreground"
                        >
                          {selectedRole === "pharmacy"
                            ? "Dispensary Physical Address"
                            : selectedRole === "doctor"
                              ? "Clinic / OPD Chamber Address"
                              : "Delivery Street Address"}
                        </Label>
                        <Input
                          id="address"
                          placeholder="14th Main, 4th Block, Koramangala"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="h-11 border-2 text-xs sm:text-sm"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="pincode"
                            className="text-xs font-bold text-foreground"
                          >
                            Postal Code / Pincode
                          </Label>
                          <Input
                            id="pincode"
                            placeholder="560034"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className="h-11 border-2 font-mono text-xs sm:text-sm"
                          />
                        </div>

                        {selectedRole === "doctor" ? (
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="speciality"
                              className="text-xs font-bold text-foreground"
                            >
                              Clinical Speciality
                            </Label>
                            <select
                              id="speciality"
                              value={speciality}
                              onChange={(e) => setSpeciality(e.target.value)}
                              className="h-11 w-full rounded-lg border-2 border-input bg-background px-3 text-xs font-semibold"
                            >
                              {CLINICAL_SPECIALITIES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : selectedRole === "pharmacy" ? (
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="operatingHours"
                              className="text-xs font-bold text-foreground"
                            >
                              Operating Hours
                            </Label>
                            <Input
                              id="operatingHours"
                              placeholder="8:00 AM - 10:00 PM"
                              value={operatingHours}
                              onChange={(e) =>
                                setOperatingHours(e.target.value)
                              }
                              className="h-11 border-2 text-xs sm:text-sm"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="emergencyContact"
                              className="text-xs font-bold text-foreground"
                            >
                              Emergency Contact (Optional)
                            </Label>
                            <Input
                              id="emergencyContact"
                              placeholder="+91 99001 22334"
                              value={emergencyContact}
                              onChange={(e) =>
                                setEmergencyContact(e.target.value)
                              }
                              className="h-11 border-2 text-xs sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3 FIELDS */}
                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="password"
                          className="text-xs font-bold text-foreground"
                        >
                          Create Password{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 border-2 pr-10 pl-9 text-xs sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password Strength Indicator */}
                      {password ? (
                        <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-muted-foreground">
                              Strength:
                            </span>
                            <span className="font-bold text-primary">
                              {STRENGTH_LABEL[strength]}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((i) => (
                              <span
                                key={i}
                                className={cn(
                                  "h-1.5 flex-1 rounded-full transition-colors",
                                  i < strength ? "bg-primary" : "bg-border",
                                )}
                              />
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                            <span
                              className={cn(
                                "flex items-center gap-1",
                                passwordRules.length
                                  ? "text-emerald-600 font-bold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {passwordRules.length ? "✓" : "•"} 8+ characters
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1",
                                passwordRules.mixedCase
                                  ? "text-emerald-600 font-bold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {passwordRules.mixedCase ? "✓" : "•"} Upper &
                              lower case
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1",
                                passwordRules.number
                                  ? "text-emerald-600 font-bold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {passwordRules.number ? "✓" : "•"} At least 1
                              number
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1",
                                passwordRules.special
                                  ? "text-emerald-600 font-bold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {passwordRules.special ? "✓" : "•"} Special symbol
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-xs font-bold text-foreground"
                        >
                          Confirm Password{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            minLength={6}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-11 border-2 pr-10 pl-9 text-xs sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me & Terms Check */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="remember-me"
                            className="text-xs font-semibold text-muted-foreground cursor-pointer select-none"
                          >
                            Remember me on this device
                          </label>
                          <Switch
                            id="remember-me"
                            checked={rememberMe}
                            onCheckedChange={setRememberMe}
                          />
                        </div>

                        <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="mt-0.5 rounded border-border text-primary focus:ring-primary size-4"
                          />
                          <span>
                            I agree to Medora&apos;s Terms of Clinical
                            Verification and Privacy Standards. Medical records
                            remain encrypted.
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                      {error}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-3">
                    <Button
                      type="submit"
                      disabled={busy}
                      className="h-12 w-full font-extrabold tracking-wider uppercase text-xs sm:text-sm shadow-md"
                    >
                      {busy ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      {step === 3 ? "Complete Registration" : "Continue →"}
                    </Button>
                  </div>
                </form>
              )}

              {/* ----------------- MODE: SIGN IN (As depicted in Reference Image 4) ----------------- */}
              {mode === "signin" && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                      Welcome back
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Sign in to continue to your Medora role workspace.
                    </p>
                  </div>

                  {/* Segmented Role Switcher Tabs */}
                  <div className="grid grid-cols-4 gap-1 rounded-xl border-2 border-border bg-muted/40 p-1">
                    {(
                      [
                        ["patient", "Patient"],
                        ["pharmacy", "Pharmacy"],
                        ["doctor", "Clinician"],
                        ["admin", "Admin"],
                      ] as const
                    ).map(([rKey, rLabel]) => (
                      <button
                        key={rKey}
                        type="button"
                        onClick={() => setSelectedRole(rKey)}
                        className={cn(
                          "rounded-lg py-2 text-xs font-bold transition-all",
                          selectedRole === rKey
                            ? "bg-card text-ink shadow-xs border border-border"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {rLabel}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSignInSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="login-email"
                        className="text-xs font-bold text-foreground"
                      >
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 border-2 pl-9 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="login-password"
                          className="text-xs font-bold text-foreground"
                        >
                          Password
                        </Label>
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 border-2 pr-10 pl-9 text-xs sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CAPTCHA / Quick Human Check (As in Reference Screenshot 4) */}
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ShieldCheck className="size-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Quick Human Check
                            </span>
                            <div className="text-xs font-bold text-ink">
                              {captchaNum1} + {captchaNum2} = ?
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input
                            placeholder="Answer"
                            value={captchaAnswer}
                            onChange={(e) =>
                              handleCaptchaChange(e.target.value)
                            }
                            className="h-8 w-20 text-center font-mono font-bold text-xs"
                          />
                          <button
                            type="button"
                            onClick={refreshCaptcha}
                            title="Refresh challenge"
                            className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <RefreshCw className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="remember-me-login"
                        className="text-xs font-semibold text-muted-foreground cursor-pointer select-none"
                      >
                        Remember me on this device
                      </label>
                      <Switch
                        id="remember-me-login"
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                      />
                    </div>

                    {error && (
                      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={busy}
                      className="h-12 w-full font-extrabold tracking-wider uppercase text-xs sm:text-sm shadow-md"
                    >
                      {busy ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Sign in →
                    </Button>
                  </form>

                  {/* Alternative Logins */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-border" />
                      <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        or continue with
                      </span>
                      <span className="h-px flex-1 bg-border" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setGoogleModalOpen(true)}
                        className="h-10 text-xs font-bold gap-2 border-2"
                      >
                        <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
                          <path
                            fill="#4285F4"
                            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
                          />
                        </svg>
                        Google Account
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => switchMode("otp")}
                        className="h-10 text-xs font-bold gap-2 border-2"
                      >
                        <KeyRound className="size-4 text-primary" />
                        OTP via Email
                      </Button>
                    </div>

                    {/* 1-Click Quick Demo Launcher */}
                    <div className="mt-4 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="size-3 text-amber-500" /> Instant Demo
                          Access
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          No password needed
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void auth.signInWithDemoRole("patient", rememberMe)
                          }
                          className="h-8 justify-start text-xs font-semibold bg-background"
                        >
                          <User className="mr-1.5 size-3.5 text-primary" />{" "}
                          Patient Hub
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void auth.signInWithDemoRole("pharmacy", rememberMe)
                          }
                          className="h-8 justify-start text-xs font-semibold bg-background"
                        >
                          <Building2 className="mr-1.5 size-3.5 text-primary" />{" "}
                          Pharmacy Deck
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void auth.signInWithDemoRole("doctor", rememberMe)
                          }
                          className="h-8 justify-start text-xs font-semibold bg-background"
                        >
                          <Stethoscope className="mr-1.5 size-3.5 text-primary" />{" "}
                          Clinician Desk
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void auth.signInWithDemoRole("admin", rememberMe)
                          }
                          className="h-8 justify-start text-xs font-semibold bg-background"
                        >
                          <ShieldCheck className="mr-1.5 size-3.5 text-primary" />{" "}
                          Admin Panel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- MODE: FORGOT PASSWORD ----------------- */}
              {mode === "forgot" && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                      Reset your password
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      We will email you a secure link to reset your account
                      password.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="forgot-email"
                      className="text-xs font-bold text-foreground"
                    >
                      Registered Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 border-2 pl-9 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                      {error}
                    </p>
                  )}
                  {notice && (
                    <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-foreground">
                      {notice}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={busy}
                    className="h-12 w-full font-extrabold tracking-wider uppercase text-xs sm:text-sm shadow-md"
                  >
                    {busy ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Send Recovery Link
                  </Button>
                </form>
              )}

              {/* ----------------- MODE: OTP LOGIN ----------------- */}
              {mode === "otp" && (
                <form onSubmit={handleOtpLogin} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                      One-Time Passcode Sign In
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Access your Medora account via instant email OTP
                      verification.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="otp-email"
                      className="text-xs font-bold text-foreground"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="otp-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 border-2 pl-9 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {notice && (
                    <div className="space-y-3">
                      <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs font-semibold text-primary">
                        {notice}
                      </p>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="otp-code"
                          className="text-xs font-bold text-foreground"
                        >
                          Enter 6-Digit OTP
                        </Label>
                        <Input
                          id="otp-code"
                          placeholder="123456"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="h-11 border-2 text-center font-mono text-base font-bold tracking-widest"
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={busy}
                    className="h-12 w-full font-extrabold tracking-wider uppercase text-xs sm:text-sm shadow-md"
                  >
                    {busy ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    {notice ? "Verify & Enter Workspace" : "Send 6-Digit Code"}
                  </Button>
                </form>
              )}

              {/* ----------------- MODE: VERIFY EMAIL ----------------- */}
              {mode === "verify" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-2">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <Mail className="size-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink">
                      Verification Link Dispatched
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We sent an activation link to{" "}
                      <strong className="text-ink font-semibold">
                        {pendingEmail}
                      </strong>
                      . Click the link to complete account setup.
                    </p>
                  </div>

                  {error && (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                      {error}
                    </p>
                  )}
                  {notice && (
                    <p className="rounded-lg border border-border bg-muted p-3 text-xs font-medium text-foreground">
                      {notice}
                    </p>
                  )}

                  <Button
                    type="button"
                    disabled={busy || cooldown > 0}
                    onClick={resend}
                    className="h-11 w-full font-bold"
                  >
                    {cooldown > 0
                      ? `Resend Link (${cooldown}s)`
                      : "Resend Verification Email"}
                  </Button>

                  <div className="rounded-xl border border-border bg-secondary/40 p-3.5 text-left text-xs space-y-1.5">
                    <p className="font-semibold text-ink flex items-center gap-1.5">
                      <HelpCircle className="size-3.5 text-primary" />
                      Not receiving the email in your inbox?
                    </p>
                    <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-1">
                      <li>
                        Check your <strong>Spam</strong> or{" "}
                        <strong>Junk</strong> folder.
                      </li>
                      <li>
                        In your Supabase Dashboard: go to{" "}
                        <strong>Authentication → Providers → Email</strong> and
                        turn off <em>&quot;Confirm email&quot;</em> for instant
                        verification.
                      </li>
                      <li>
                        Or configure custom SMTP in{" "}
                        <strong>Project Settings → Auth</strong>.
                      </li>
                    </ul>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEmail(pendingEmail);
                      setMode("signin");
                    }}
                    className="h-10 w-full text-xs font-semibold"
                  >
                    Proceed to Sign In Directly →
                  </Button>
                </div>
              )}

              {/* FOOTER SWITCHER */}
              <div className="mt-6 border-t border-border pt-4 text-center">
                {mode === "signin" ? (
                  <p className="text-xs text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("roles")}
                      className="font-extrabold text-primary underline-offset-4 hover:underline"
                    >
                      Create one free
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="font-extrabold text-primary underline-offset-4 hover:underline"
                    >
                      Sign in instead
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
