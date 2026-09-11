import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Info,
  Layers,
  Pill,
  Shield,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { AiPayload } from "@/ai/schemas";
import { safetyNoticeOf } from "@/ai/render";
import { EmergencyCallout } from "@/components/common/primitives";
import { BulletList, FieldGrid } from "./ai-parts";

export function AiPayloadView({ payload }: { payload: AiPayload }) {
  const notice = safetyNoticeOf(payload);

  return (
    <div className="space-y-4">
      {payload.kind === "escalation" && (
        <div className="space-y-3">
          <EmergencyCallout />
          <p className="text-sm font-medium text-destructive">
            {payload.action}
          </p>
        </div>
      )}

      {payload.kind === "medicine_explanation" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Drug
              </span>
              <p className="mt-0.5 text-xs font-semibold text-foreground">
                {payload.activeIngredient}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Strength
              </span>
              <p className="mt-0.5 text-xs font-semibold text-foreground">
                {payload.strength}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Form
              </span>
              <p className="mt-0.5 text-xs font-semibold text-foreground">
                {payload.form}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Classification
              </span>
              <p className="mt-0.5 text-xs font-semibold text-foreground">
                {payload.supply === "prescription_only"
                  ? "Prescription Only"
                  : "Over The Counter"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Info className="size-3.5 text-primary" /> Clinical Indication &
              Guidance
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {payload.information}
            </p>
          </div>

          {payload.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" /> Key Safety Warnings
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {payload.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2">
                    <span className="mt-1 size-1 rounded-full bg-amber-500 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {payload.commonSideEffects.length > 0 && (
            <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Common Side Effects
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {payload.commonSideEffects.map((se) => (
                  <span
                    key={se}
                    className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {se}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {payload.kind === "medicine_comparison" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {payload.rows.map((row, idx) => (
              <div
                key={row.medicine + idx}
                className="flex flex-col justify-between rounded-xl border-2 border-primary/20 bg-card p-4 shadow-xs transition hover:border-primary/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-sm font-bold text-ink">
                      {row.medicine}
                    </h4>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                      {row.form}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">API: </span>
                    {row.activeIngredient}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between border-t border-border/50 pt-1.5">
                      <span>Strength:</span>
                      <span className="font-medium text-foreground">
                        {row.strength}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-1.5">
                      <span>Status:</span>
                      <span className="font-medium text-foreground">
                        {row.supply}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-1.5">
                      <span>Manufacturer:</span>
                      <span className="font-medium text-foreground truncate max-w-[120px]">
                        {row.manufacturer}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1 text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-emerald-600 dark:text-emerald-400" />{" "}
              Bioequivalence Assessment
            </span>
            <p className="text-muted-foreground leading-relaxed">
              {payload.equivalence}
            </p>
          </div>
        </div>
      )}

      {payload.kind === "interaction_report" && (
        <div className="space-y-3">
          {payload.findings.map((finding) => {
            const isSevere = finding.severity === "severe";
            const isModerate = finding.severity === "moderate";
            const isSafe =
              finding.severity === "safe" || finding.type === "safe";

            const borderTone = isSevere
              ? "border-rose-500/40 bg-rose-500/5"
              : isModerate
                ? "border-amber-500/40 bg-amber-500/5"
                : isSafe
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-blue-500/40 bg-blue-500/5";

            const badgeTone = isSevere
              ? "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400"
              : isModerate
                ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : isSafe
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400";

            return (
              <div
                key={finding.title}
                className={`rounded-xl border-2 p-4 shadow-xs space-y-2.5 ${borderTone}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    {isSevere ? (
                      <ShieldAlert className="size-4 text-rose-600" />
                    ) : isModerate ? (
                      <AlertTriangle className="size-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    )}
                    {finding.title}
                  </p>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeTone}`}
                  >
                    {finding.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {finding.detail}
                </p>
                {finding.items.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Drugs:
                    </span>
                    {finding.items.map((it) => (
                      <span
                        key={it}
                        className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-semibold text-foreground"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {payload.kind === "informational_answer" && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {payload.bullets.map((b, idx) => (
              <div
                key={b.label + idx}
                className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-1 transition hover:border-primary/30"
              >
                <div className="text-[11px] font-bold uppercase tracking-wide text-primary flex items-center gap-1">
                  <Sparkles className="size-3" /> {b.label}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {b.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {payload.kind === "lab_explanation" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {payload.analytes.map((analyte) => {
              const isHigh = analyte.flag === "high";
              const isLow = analyte.flag === "low";
              const flagTone = isHigh
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : isLow
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

              return (
                <div
                  key={analyte.name}
                  className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {analyte.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Range: {analyte.referenceRange}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-foreground">
                        {analyte.value}
                      </span>
                      <div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${flagTone}`}
                        >
                          {analyte.flag}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-1.5">
                    {analyte.plainLanguage}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {payload.kind === "symptom_triage" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-card p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Triage Tier
              </span>
              <p className="mt-0.5 text-xs font-bold text-primary uppercase">
                {payload.escalation.level.replace("_", " ")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Symptoms Read
              </span>
              <p className="mt-0.5 text-xs font-medium text-foreground truncate">
                {payload.symptoms.join(", ") || "—"}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Recommended Clinical Action
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {payload.escalation.action}
            </p>
          </div>
          {payload.redFlags.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Emergency Red Flags
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {payload.redFlags.map((rf) => (
                  <li key={rf} className="flex items-start gap-1.5">
                    <span className="mt-1 size-1 rounded-full bg-rose-500 shrink-0" />
                    <span>{rf}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {payload.kind === "search_interpretation" && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            {payload.matches.map((match) => (
              <Link
                key={match.id}
                to="/app/medicine/$medicineId"
                params={{ medicineId: match.id }}
                className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 flex items-center gap-1.5"
              >
                <span>{match.label}</span>
                <ArrowRight className="size-3" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {payload.kind === "unavailable" && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Guidance: </span>
          {payload.whatALiveProviderWouldDo}
        </p>
      )}
    </div>
  );
}
