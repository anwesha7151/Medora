import type { FC } from "react";
import {
  Check,
  ShieldCheck,
  Sparkles,
  Building2,
  User,
  Stethoscope,
  ArrowRight,
  Zap,
  FileCheck2,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/domain";

export interface RoleFeatureInfo {
  role: "patient" | "pharmacy" | "doctor";
  title: string;
  badge: string;
  stats: { label: string; value: string };
  features: string[];
  illustrationBg: string;
}

export const ROLE_DETAILS: Record<
  "patient" | "pharmacy" | "doctor",
  RoleFeatureInfo
> = {
  patient: {
    role: "patient",
    title: "Patient & Caregiver Hub",
    badge: "Personal Health",
    stats: { label: "Verified Pharmacies", value: "140+ Local Stores" },
    features: [
      "Compare real-time generic & branded prices",
      "Upload Rx photos for plain-English breakdowns",
      "Automated dose & refill interaction reminders",
    ],
    illustrationBg: "from-teal-500/10 via-emerald-500/5 to-transparent",
  },
  pharmacy: {
    role: "pharmacy",
    title: "Pharmacy Operations Deck",
    badge: "Dispensary Partner",
    stats: { label: "Order Fulfilment", value: "Instant Rx Dispatch" },
    features: [
      "Digital prescription intake & stock sync",
      "Batch pricing & competitor price analysis",
      "Counter pickup & customer refill pipeline",
    ],
    illustrationBg: "from-sky-500/10 via-indigo-500/5 to-transparent",
  },
  doctor: {
    role: "doctor",
    title: "Clinician E-Prescribing Suite",
    badge: "Licensed Practitioner",
    stats: { label: "Clinical Safety", value: "0-Latency Interactions" },
    features: [
      "Digital script authoring with auto-dosing guide",
      "Instant drug-drug contraindication warnings",
      "Patient medication timeline & lab correlation",
    ],
    illustrationBg: "from-emerald-500/10 via-teal-500/5 to-transparent",
  },
};

/**
 * Clean 2D Vector Illustration for the Medora Brand Panel
 */
export const MedoraHero2DGraphic: FC<{
  selectedRole: "patient" | "pharmacy" | "doctor";
}> = ({ selectedRole }) => {
  const current = ROLE_DETAILS[selectedRole];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-2 border-border/80 bg-card p-6 shadow-sm">
      {/* 2D Grid & Geometric Accents */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

      {/* Floating 2D Status Tag */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
            2D
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary">
              {current.badge}
            </div>
            <div className="text-sm font-extrabold text-ink">
              {current.title}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          <span>Active View</span>
        </div>
      </div>

      {/* 2D Central Diagram */}
      <div className="relative z-10 my-5 flex flex-col items-center justify-center">
        <div className="relative flex h-40 w-full max-w-[280px] items-center justify-center">
          {/* Outer circle frame */}
          <div className="absolute size-36 rounded-full border-2 border-dashed border-primary/30 animate-spin-slow" />

          {/* Inner 2D card composition */}
          <div className="relative z-10 flex flex-col items-center justify-center rounded-xl border-2 border-border bg-background p-4 shadow-sm w-44">
            {selectedRole === "patient" && (
              <>
                <div className="flex size-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 mb-2">
                  <User className="size-6 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-ink">
                  Smart Med Tracker
                </span>
                <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                  Compare & Save ₹
                </span>
              </>
            )}
            {selectedRole === "pharmacy" && (
              <>
                <div className="flex size-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 mb-2">
                  <Building2 className="size-6 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-ink">
                  Dispensary Hub
                </span>
                <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                  Live Stock & Orders
                </span>
              </>
            )}
            {selectedRole === "doctor" && (
              <>
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-2">
                  <Stethoscope className="size-6 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-ink">
                  Clinical Desk
                </span>
                <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                  Digital Rx & Contra
                </span>
              </>
            )}
          </div>

          {/* 2D Satellite badges */}
          <div className="absolute -left-2 top-4 flex items-center gap-1 rounded-md border border-border bg-paper px-2 py-1 text-[11px] font-medium shadow-xs text-ink">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Verified</span>
          </div>

          <div className="absolute -right-2 bottom-3 flex items-center gap-1 rounded-md border border-border bg-paper px-2 py-1 text-[11px] font-medium shadow-xs text-ink">
            <Zap className="size-3.5 text-amber-500" />
            <span>Instant Sync</span>
          </div>
        </div>
      </div>

      {/* 2D Feature Checklist */}
      <div className="relative z-10 space-y-2 rounded-xl bg-muted/50 p-3.5 border border-border/60">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Included in {current.title}
        </div>
        <div className="space-y-1.5">
          {current.features.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs font-medium text-ink"
            >
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-2.5 stroke-[3]" />
              </span>
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2D Footer metric strip */}
      <div className="relative z-10 mt-3 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs">
        <span className="text-muted-foreground">{current.stats.label}</span>
        <span className="font-bold text-primary">{current.stats.value}</span>
      </div>
    </div>
  );
};

/**
 * 2D Password Requirement item
 */
export const PasswordRequirementItem: FC<{ met: boolean; text: string }> = ({
  met,
  text,
}) => (
  <div
    className={cn(
      "flex items-center gap-1.5 text-xs transition-colors",
      met
        ? "font-medium text-emerald-700 dark:text-emerald-400"
        : "text-muted-foreground",
    )}
  >
    <div
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-all",
        met
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-muted-foreground/30 bg-muted/40 text-transparent",
      )}
    >
      <Check className="size-2.5 stroke-[3]" />
    </div>
    <span>{text}</span>
  </div>
);

/**
 * 2D Trust Guarantee Strip
 */
export const TrustGuaranteeStrip: FC = () => (
  <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
    <div className="rounded-lg border border-border/70 bg-card p-2">
      <FileCheck2 className="mx-auto mb-1 size-4 text-primary" />
      <div className="text-[11px] font-bold text-ink">100% Provenance</div>
      <div className="text-[10px] text-muted-foreground">Sourced & dated</div>
    </div>
    <div className="rounded-lg border border-border/70 bg-card p-2">
      <ShieldCheck className="mx-auto mb-1 size-4 text-primary" />
      <div className="text-[11px] font-bold text-ink">DPDP Vault</div>
      <div className="text-[10px] text-muted-foreground">Privacy assured</div>
    </div>
    <div className="rounded-lg border border-border/70 bg-card p-2">
      <HeartPulse className="mx-auto mb-1 size-4 text-primary" />
      <div className="text-[11px] font-bold text-ink">Clinical Grade</div>
      <div className="text-[10px] text-muted-foreground">Safety verified</div>
    </div>
  </div>
);
