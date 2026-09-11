import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  ShieldCheck,
  Building2,
  User,
  Stethoscope,
  Pill,
  CheckCircle2,
  Activity,
  Lock,
  HeartPulse,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/domain";

export interface RoleHeroContent {
  headline: string;
  subheadline: string;
  badge: string;
  roleTheme: {
    bgGradient: string;
    orbPrimary: string;
    orbSecondary: string;
    orbAccent: string;
    accentGlow: string;
    metricGradient: string;
  };
  statLabel: string;
  statValue: string;
  metricSub: string;
  highlights: { title: string; subtitle: string }[];
}

export const ROLE_HERO_DATA: Record<
  Exclude<AppRole, "admin"> | "admin",
  RoleHeroContent
> = {
  patient: {
    headline: "Find medicines and manage prescriptions with confidence.",
    subheadline:
      "Search any medicine across verified local pharmacies, compare transparent pricing, and receive automated dosage safety alerts.",
    badge: "PATIENT & CAREGIVER WORKSPACE",
    roleTheme: {
      bgGradient: "from-[#0b3d36] via-[#082a25] to-[#041714]",
      orbPrimary: "rgba(20, 184, 166, 0.35)", // Teal
      orbSecondary: "rgba(16, 185, 129, 0.3)", // Emerald
      orbAccent: "rgba(45, 212, 191, 0.4)", // Cyan
      accentGlow: "from-emerald-400 to-teal-300",
      metricGradient: "from-teal-400 via-emerald-400 to-cyan-300",
    },
    statLabel: "Licensed Dispensary Network",
    statValue: "140+ Pharmacies",
    metricSub: "94% City-wide Availability",
    highlights: [
      {
        title: "AI Prescription Parsing",
        subtitle: "Instant OCR extraction in under 3 seconds",
      },
      {
        title: "National Medicine Catalog",
        subtitle: "Verified generics & branded price transparency",
      },
      {
        title: "Drug-Drug Safety Shield",
        subtitle: "Automatic contraindication & dosage audit",
      },
    ],
  },
  pharmacy: {
    headline: "Grow your dispensary with AI-powered operations.",
    subheadline:
      "Real-time demand forecasting, automated digital prescription intake, and instant local delivery fulfillment across your city.",
    badge: "PHARMACY OPERATIONS DECK",
    roleTheme: {
      bgGradient: "from-[#0d2847] via-[#091b33] to-[#040e1c]",
      orbPrimary: "rgba(59, 130, 246, 0.35)", // Blue
      orbSecondary: "rgba(99, 102, 241, 0.3)", // Indigo
      orbAccent: "rgba(14, 165, 233, 0.4)", // Sky
      accentGlow: "from-blue-400 to-cyan-300",
      metricGradient: "from-blue-400 via-indigo-400 to-cyan-300",
    },
    statLabel: "Intake Velocity & Sync",
    statValue: "100% Digital Rx",
    metricSub: "99.8% Inventory Accuracy",
    highlights: [
      {
        title: "Zero-Latency Rx Intake",
        subtitle: "Instant digital prescription & stock synchronization",
      },
      {
        title: "AI Predictive Restock",
        subtitle: "7-day localized demand forecast with reorder alerts",
      },
      {
        title: "Fulfillment Pipeline",
        subtitle: "Express pickup & geo-routed local delivery",
      },
    ],
  },
  doctor: {
    headline: "Streamline clinical consults with verified drug safety.",
    subheadline:
      "Author digital prescriptions with 0-latency contraindication checks, patient medication timelines, and evidence-backed dosage guides.",
    badge: "CLINICIAN DESK & E-PRESCRIBING",
    roleTheme: {
      bgGradient: "from-[#0f3542] via-[#09222b] to-[#041117]",
      orbPrimary: "rgba(6, 182, 212, 0.35)", // Cyan
      orbSecondary: "rgba(20, 184, 166, 0.3)", // Teal
      orbAccent: "rgba(56, 189, 248, 0.4)", // Sky
      accentGlow: "from-cyan-400 to-sky-300",
      metricGradient: "from-cyan-400 via-teal-300 to-sky-200",
    },
    statLabel: "Clinical Safety Audit",
    statValue: "0-Latency Grounding",
    metricSub: "Verified Evidence Database",
    highlights: [
      {
        title: "Digital Prescription Engine",
        subtitle: "One-click dosage calculations & repeat templates",
      },
      {
        title: "Live Interaction Scanner",
        subtitle: "Multi-drug & allergen contraindication detection",
      },
      {
        title: "Unified Patient Timelines",
        subtitle: "Comprehensive longitudinal medication histories",
      },
    ],
  },
  admin: {
    headline: "Comprehensive multi-tenant healthcare governance.",
    subheadline:
      "Monitor dispensary compliance, audit clinical intelligence logs, and supervise national drug catalog updates seamlessly.",
    badge: "ADMINISTRATIVE CONTROL SUITE",
    roleTheme: {
      bgGradient: "from-[#1e1b4b] via-[#141236] to-[#0a081c]",
      orbPrimary: "rgba(139, 92, 246, 0.35)", // Violet
      orbSecondary: "rgba(99, 102, 241, 0.3)", // Indigo
      orbAccent: "rgba(168, 85, 247, 0.4)", // Purple
      accentGlow: "from-violet-400 to-fuchsia-300",
      metricGradient: "from-violet-400 via-purple-400 to-indigo-300",
    },
    statLabel: "Platform Integrity & Audits",
    statValue: "99.99% Uptime",
    metricSub: "HIPAA & ISO 27001 Compliant",
    highlights: [
      {
        title: "License Verification Hub",
        subtitle: "Automated regulatory dispensary credentialing",
      },
      {
        title: "Full Audit Trail Logging",
        subtitle: "End-to-end clinical AI decisions & data access",
      },
      {
        title: "Catalog Master Control",
        subtitle: "Real-time pricing, batches & recall distribution",
      },
    ],
  },
};

/**
 * 3D Glass Pill Element with specular reflection and inner glow
 */
const Floating3DPill: React.FC<{
  className?: string;
  rotateDeg?: number;
  delay?: number;
}> = ({ className, rotateDeg = -15, delay = 0 }) => {
  return (
    <motion.div
      initial={{ y: 0, rotate: rotateDeg }}
      animate={{
        y: [-8, 8, -8],
        rotate: [rotateDeg - 4, rotateDeg + 4, rotateDeg - 4],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={cn(
        "pointer-events-none relative flex h-14 w-28 items-center rounded-full border border-white/40 p-1 shadow-[0_16px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 100%)",
        boxShadow:
          "inset 0 1px 2px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.2), 0 20px 40px rgba(0,0,0,0.4)",
      }}
    >
      {/* Left half of capsule */}
      <div className="relative flex h-full w-1/2 items-center justify-center rounded-l-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-inner">
        <div className="absolute top-1.5 left-2.5 h-2.5 w-6 rounded-full bg-white/60 blur-[1px]" />
        <HeartPulse className="size-4 text-white drop-shadow-sm" />
      </div>
      {/* Right half of capsule */}
      <div className="relative flex h-full w-1/2 items-center justify-center rounded-r-full bg-white/20 backdrop-blur-md">
        <div className="absolute top-1.5 right-2.5 h-2.5 w-6 rounded-full bg-white/40 blur-[1px]" />
        <Sparkles className="size-3.5 text-white/90" />
      </div>
    </motion.div>
  );
};

/**
 * 3D Glass Shield Badge
 */
const Floating3DShield: React.FC<{
  className?: string;
  delay?: number;
}> = ({ className, delay = 0.5 }) => {
  return (
    <motion.div
      initial={{ y: 0, rotate: 10 }}
      animate={{
        y: [6, -6, 6],
        rotate: [8, 14, 8],
      }}
      transition={{
        duration: 4.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={cn(
        "pointer-events-none relative flex size-14 items-center justify-center rounded-2xl border border-white/40 shadow-[0_16px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(20, 184, 166, 0.2) 100%)",
        boxShadow:
          "inset 0 1px 2px rgba(255, 255, 255, 0.7), 0 15px 35px rgba(0,0,0,0.3)",
      }}
    >
      <div className="absolute top-1 left-2 size-4 rounded-full bg-white/50 blur-[1px]" />
      <ShieldCheck className="size-7 text-emerald-300 drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
    </motion.div>
  );
};

/**
 * High-End 3D Interactive Medical Hero Box
 * - Strictly NO background grid lines
 * - Multi-layered 3D space with specular lighting, glass refraction, floating 3D pills, and smooth parallax
 */
export const Auth3DHeroVisual: React.FC<{
  role: Exclude<AppRole, "admin"> | "admin";
  currentStep?: number | undefined;
  totalSteps?: number | undefined;
  stepTitle?: string | undefined;
  isLogin?: boolean | undefined;
}> = ({
  role,
  currentStep = 1,
  totalSteps = 3,
  stepTitle = "Personal Info",
  isLogin = false,
}) => {
  const data = ROLE_HERO_DATA[role] || ROLE_HERO_DATA.patient;

  // 3D Parallax Tilt Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 110 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [10, -10]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-10, 10]),
    springConfig,
  );

  // Sheen light coordinates
  const sheenX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [20, 80]),
    springConfig,
  );
  const sheenY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [20, 80]),
    springConfig,
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex h-full min-h-[640px] w-full flex-col justify-between overflow-hidden rounded-[2rem] border border-white/15 p-8 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-700 lg:p-10",
        "bg-gradient-to-br",
        data.roleTheme.bgGradient,
      )}
      style={{ perspective: 1200 }}
    >
      {/* Dynamic Ambient 3D Glowing Spheres (Pure smooth lighting - NO grids) */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.85, 0.6],
          x: [-20, 20, -20],
          y: [-10, 15, -10],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-32 -left-32 size-[420px] rounded-full blur-[90px]"
        style={{ backgroundColor: data.roleTheme.orbPrimary }}
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
          x: [20, -15, 20],
          y: [15, -20, 15],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="pointer-events-none absolute -bottom-32 -right-32 size-[460px] rounded-full blur-[100px]"
        style={{ backgroundColor: data.roleTheme.orbSecondary }}
      />
      <motion.div
        animate={{
          scale: [0.9, 1.15, 0.9],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="pointer-events-none absolute top-1/2 left-1/3 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
        style={{ backgroundColor: data.roleTheme.orbAccent }}
      />

      {/* Floating 3D Medicine Elements in Background Layer */}
      <Floating3DPill
        className="absolute top-12 right-6 z-0 opacity-85 lg:right-10"
        rotateDeg={-18}
        delay={0}
      />
      <Floating3DShield
        className="absolute top-48 right-4 z-0 opacity-80 lg:right-8"
        delay={0.8}
      />

      {/* Dynamic Specular Sheen Layer that tracks the cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-40 transition-opacity duration-300"
        style={{
          background: useTransform(
            [sheenX, sheenY],
            ([x, y]) =>
              `radial-gradient(circle 500px at ${x}% ${y}%, rgba(255,255,255,0.22), transparent 70%)`,
          ),
        }}
      />

      {/* Glass Frost Vignette Overlays */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/40 via-transparent to-white/5" />

      {/* TOP HEADER STATUS BAR */}
      <div className="relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex size-11 items-center justify-center rounded-2xl border border-white/30 bg-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.2)] backdrop-blur-xl"
            style={{
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.5)",
            }}
          >
            {role === "patient" && <User className="size-5 text-white" />}
            {role === "pharmacy" && <Building2 className="size-5 text-white" />}
            {role === "doctor" && <Stethoscope className="size-5 text-white" />}
            {role === "admin" && <ShieldCheck className="size-5 text-white" />}
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-white/75">
              {data.badge}
            </span>
            <div className="text-xs font-bold text-white/95">
              Verified Healthcare Ecosystem
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xl">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <span className="tracking-wide">Live Network</span>
        </div>
      </div>

      {/* CENTER 3D INTERACTIVE STAGE (Depth with preserve-3d) */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative z-20 my-6 space-y-6"
      >
        {/* Dynamic Headline with depth */}
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ transform: "translateZ(30px)" }}
          className="space-y-3"
        >
          <h2 className="font-display text-3xl font-extrabold leading-[1.18] tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] xl:text-4xl">
            {data.headline}
          </h2>
          <p className="max-w-md text-sm leading-relaxed font-normal text-white/80">
            {data.subheadline}
          </p>
        </motion.div>

        {/* 3D Floating Feature Pills (Glassmorphism + depth) */}
        <div
          style={{ transform: "translateZ(45px)" }}
          className="space-y-3 pt-1"
        >
          {data.highlights.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.025, x: 6 }}
              className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] p-3.5 text-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-white/[0.14]"
              style={{
                boxShadow:
                  "inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 12px 28px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Inner ambient light glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/25 to-white/5 shadow-inner border border-white/30 text-emerald-300">
                <CheckCircle2 className="size-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white tracking-wide">
                  {item.title}
                </div>
                <div className="truncate text-[11px] text-white/70">
                  {item.subtitle}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3D Interactive Telemetry Hologram Card with live SVG ECG Pulse */}
        <motion.div
          whileHover={{ translateY: -4, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-r from-white/[0.12] to-white/[0.04] p-4.5 shadow-[0_15px_35px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
          style={{
            transform: "translateZ(60px)",
            boxShadow:
              "inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 20px 40px rgba(0,0,0,0.35)",
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 shadow-inner">
                <Activity className="size-4 animate-pulse" />
              </div>
              <div>
                <div className="font-bold tracking-wide text-white/95">
                  {data.statLabel}
                </div>
                <div className="text-[10px] text-white/70">
                  {data.metricSub}
                </div>
              </div>
            </div>
            <span
              className={cn(
                "rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-xs font-extrabold text-white shadow-sm backdrop-blur-md",
              )}
            >
              {data.statValue}
            </span>
          </div>

          {/* Holographic Pulse Line */}
          <div className="mt-3.5 flex items-center gap-3">
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/20">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "94%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full bg-gradient-to-r shadow-[0_0_12px_rgba(45,212,191,0.8)]",
                  data.roleTheme.accentGlow,
                )}
              />
            </div>
            <span className="font-mono text-[11px] font-bold text-white/90">
              94% Active
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* FOOTER WIDGET (Progress indicator for Signup / Security for Login) */}
      <div className="relative z-20">
        {!isLogin ? (
          <div
            className="rounded-2xl border border-white/20 bg-black/30 p-4 shadow-xl backdrop-blur-xl"
            style={{
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
            }}
          >
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">
                GETTING STARTED
              </span>
              <span className="font-bold text-emerald-300">
                Step {currentStep} of {totalSteps}: {stepTitle}
              </span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 flex-1 overflow-hidden rounded-full bg-white/20"
                >
                  <motion.div
                    initial={{
                      width:
                        i + 1 < currentStep
                          ? "100%"
                          : i + 1 === currentStep
                            ? "60%"
                            : "0%",
                    }}
                    animate={{
                      width: i + 1 <= currentStep ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "h-full transition-all",
                      i + 1 <= currentStep
                        ? "bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                        : "bg-transparent",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-between rounded-2xl border border-white/20 bg-black/30 px-4.5 py-3 text-xs text-white/90 shadow-xl backdrop-blur-xl"
            style={{
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <Lock className="size-4 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="font-semibold text-xs text-white/90">
                End-to-End Encrypted Health Records
              </span>
            </div>
            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-md">
              HIPAA & NABH Ready
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 3D Interactive Role Selection Card with Spring physics & Hover Elevation
 */
export const RoleSelectionCard3D: React.FC<{
  roleKey: "patient" | "pharmacy" | "doctor";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  selected?: boolean;
  onClick: () => void;
}> = ({
  roleKey,
  title,
  description,
  icon: Icon,
  badge,
  selected = false,
  onClick,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl border-2 p-6 text-left transition-all duration-300 shadow-sm",
        selected
          ? "border-primary bg-primary/5 ring-4 ring-primary/15 shadow-xl"
          : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30 hover:shadow-lg",
      )}
    >
      {/* 3D Corner Badge */}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-13 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm",
            selected
              ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
              : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary",
          )}
        >
          <Icon className="size-6 stroke-[2.2]" />
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider transition-colors",
            selected
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
          )}
        >
          {badge}
        </span>
      </div>

      <div className="mt-5 space-y-1.5">
        <h3 className="font-display text-xl font-extrabold tracking-tight text-ink group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground font-normal">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs font-bold text-primary">
        <span className="group-hover:translate-x-1 transition-transform">
          Select & Continue →
        </span>
        {selected && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-extrabold">
            ✓
          </span>
        )}
      </div>
    </motion.button>
  );
};
