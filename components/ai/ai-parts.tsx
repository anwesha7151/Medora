import {
  AlertTriangle,
  BadgeCheck,
  CircleSlash,
  FlaskConical,
  Gauge,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { confidenceCopy } from "@/ai/render";
import type {
  AiEnvelope,
  AiSource,
  PipelineStage,
  SafetyVerdict,
} from "@/ai/schemas";

export function ModeBadge({ envelope: _envelope }: { envelope: AiEnvelope }) {
  // Completely hidden from frontend UI everywhere as per user requirement
  return null;
}

export function ConfidenceBadge({ envelope }: { envelope: AiEnvelope }) {
  const { level, score, rationale } = envelope.confidence;
  const tone =
    level === "high"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : level === "moderate"
        ? "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
        : "border-muted-foreground/30 bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tone,
      )}
      title={rationale}
    >
      <Gauge className="size-3" aria-hidden />
      {confidenceCopy[level]} · {Math.round(score * 100)}%
    </span>
  );
}

export function SourceChips({ sources }: { sources: AiSource[] }) {
  if (!sources.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source) => (
        <span
          key={source.id}
          title={`${source.detail}${source.updatedAt ? ` Updated ${source.updatedAt}.` : ""}`}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground"
        >
          {source.verified ? (
            <BadgeCheck className="size-3 shrink-0 text-primary" aria-hidden />
          ) : (
            <CircleSlash className="size-3 shrink-0" aria-hidden />
          )}
          <span className="truncate">{source.label}</span>
        </span>
      ))}
    </div>
  );
}

export function SafetyStrip({ safety }: { safety: SafetyVerdict }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs",
        safety.passed
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
          : "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      {safety.passed ? (
        <ShieldCheck
          className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
      ) : (
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      )}
      <span className="font-medium">
        {safety.passed ? "Clinical Safety Validated" : safety.notice} ·{" "}
        {safety.rulesRun.length} rules checked
      </span>
    </div>
  );
}

export function PipelineTrace({ trace }: { trace: PipelineStage[] }) {
  if (!trace.length) return null;
  return (
    <details className="group rounded-xl border border-border/70 bg-card/60 px-3.5 py-2 text-xs transition">
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-muted-foreground hover:text-foreground">
        <span className="flex items-center gap-2">
          <Workflow className="size-3.5 text-primary" aria-hidden />
          Clinical Verification & Reasoning Trace
        </span>
        <span className="text-[10px] text-muted-foreground group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <ol className="mt-3 divide-y divide-border/40 pt-1 space-y-2">
        {trace.map((stage, i) => (
          <li key={`${stage.name}-${i}`} className="flex gap-3 pt-2">
            <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              0{i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs">
                  {stage.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      stage.status === "ok"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : stage.status === "blocked"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {stage.status}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {stage.ms}ms
                  </span>
                </div>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                {stage.detail}
              </p>
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function FieldGrid({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  if (!items.length) return null;
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-lg border border-border bg-muted/30 px-3 py-2"
        >
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BulletList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="mt-1.5 space-y-1 text-sm text-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
