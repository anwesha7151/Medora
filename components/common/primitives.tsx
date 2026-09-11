import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  FlaskConical,
  Info,
  PlugZap,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { integrations, type IntegrationKey } from "@/services/provider";
import type { Provenance } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string | undefined;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-[7px] bg-primary text-primary-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path
            d="M3 13h3.2l2-4.5 3 9 2.4-6 1.7 3.5H21"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[1.06rem] font-extrabold tracking-tight text-ink">
          Medora
        </span>
      )}
    </span>
  );
}

export function DemoBadge({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  // Hidden from frontend across all roles
  return null;
}

export function ProvenanceLine({ provenance }: { provenance: Provenance }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
        <Info className="size-3.5" aria-hidden /> Source
      </span>
      <span>{provenance.source}</span>
      <span aria-hidden>·</span>
      <span>updated {provenance.updatedAt}</span>
      <span aria-hidden>·</span>
      <span
        className={
          provenance.verified ? "text-success" : "text-warning-foreground"
        }
      >
        {provenance.verified ? "verified provider" : "unverified demo provider"}
      </span>
      {provenance.note && (
        <span className="w-full text-muted-foreground/80">
          {provenance.note}
        </span>
      )}
    </p>
  );
}

export function SafetyNotice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "emergency" | undefined;
  title: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  const Icon =
    tone === "emergency"
      ? AlertTriangle
      : tone === "warning"
        ? AlertTriangle
        : ShieldCheck;
  return (
    <div
      role={tone === "emergency" ? "alert" : "note"}
      className={cn(
        "flex items-start gap-3.5 rounded-2xl border p-4 text-sm shadow-2xs transition-all",
        tone === "emergency" &&
          "border-destructive/30 bg-destructive-soft/60 text-destructive-foreground",
        tone === "warning" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        tone === "info" && "border-primary/20 bg-primary/5 text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-xl",
          tone === "emergency" && "bg-destructive/20 text-destructive",
          tone === "warning" &&
            "bg-amber-500/20 text-amber-600 dark:text-amber-400",
          tone === "info" && "bg-primary/20 text-primary",
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="space-y-1">
        <p className="font-bold text-ink text-sm tracking-tight">{title}</p>
        <div className="text-xs leading-relaxed text-muted-foreground [&_a]:underline font-medium">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ClinicalDisclaimer({ className }: { className?: string }) {
  return (
    <SafetyNotice
      title="Informational only — not medical advice"
      className={className}
    >
      Medora helps you understand medicines and find them nearby. It does not
      diagnose conditions, prescribe, or change a dose. Always confirm with a
      pharmacist or doctor, and use emergency services for anything urgent.
    </SafetyNotice>
  );
}

export function IntegrationNotConnected({
  integration,
  action,
  className,
}: {
  integration: IntegrationKey;
  action?: ReactNode | undefined;
  className?: string | undefined;
}) {
  const meta = integrations[integration];
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-dashed border-border-strong bg-secondary/60 p-5 text-sm sm:flex-row sm:items-center",
        className,
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-card text-muted-foreground">
        <PlugZap className="size-4" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-ink">{meta.label} is not connected</p>
        <p className="text-muted-foreground">
          {meta.liveDescription} Until it is connected, Medora shows clearly
          labelled demo behaviour instead of inventing results.
        </p>
      </div>
      {action}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-balance text-2xl font-bold sm:text-[1.75rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  demo,
  actions,
}: {
  title: string;
  description?: string | undefined;
  demo?: boolean | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  icon?: LucideIcon | undefined;
  tone?: "default" | "positive" | "attention" | undefined;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-card/90 p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <p
        className={cn(
          "numeric mt-3 font-display text-2xl font-black tracking-tight text-ink",
          tone === "positive" && "text-emerald-600 dark:text-emerald-400",
          tone === "attention" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary/40" />
          {hint}
        </p>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-card/50 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-4 font-semibold text-ink">{title}</p>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function AvailabilityPill({
  value,
}: {
  value: "in_stock" | "low_stock" | "out_of_stock";
}) {
  const map = {
    in_stock: {
      label: "In stock",
      cls: "border-success/35 bg-success-soft text-success",
    },
    low_stock: {
      label: "Low stock",
      cls: "border-warning/40 bg-warning-soft text-warning-foreground",
    },
    out_of_stock: {
      label: "Out of stock",
      cls: "border-border bg-secondary text-muted-foreground",
    },
  } as const;
  const item = map[value];
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        item.cls,
      )}
    >
      {item.label}
    </span>
  );
}

export function RxPill({ prescriptionOnly }: { prescriptionOnly: boolean }) {
  return (
    <Badge
      variant={prescriptionOnly ? "outline" : "secondary"}
      className="font-medium"
    >
      {prescriptionOnly ? "Prescription-only" : "Over the counter"}
    </Badge>
  );
}

export function EmergencyCallout({ className }: { className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-lg border border-destructive/45 bg-destructive-soft p-4",
        className,
      )}
    >
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-destructive"
          aria-hidden
        />
        <div className="text-sm">
          <p className="font-semibold text-ink">
            If this is an emergency, stop here
          </p>
          <p className="text-muted-foreground">
            Call your local emergency number or go to the nearest emergency
            department. Medora cannot assess emergencies.
          </p>
        </div>
      </div>
      <Button asChild variant="destructive" size="sm">
        <Link to="/emergency">Emergency guidance</Link>
      </Button>
    </div>
  );
}
