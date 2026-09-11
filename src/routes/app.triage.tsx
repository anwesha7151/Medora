import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ClinicalDisclaimer,
  EmergencyCallout,
  IntegrationNotConnected,
  PageHeader,
  SafetyNotice,
} from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { runTriage, type TriageResult } from "@/services/clinical";

export const Route = createFileRoute("/app/triage")({
  head: () => ({
    meta: [
      { title: "Symptom check — Medora" },
      {
        name: "description",
        content:
          "A routing tool that suggests where to seek care. Medora does not diagnose conditions or recommend medicines.",
      },
      { property: "og:title", content: "Symptom check — Medora" },
      {
        property: "og:description",
        content: "Where to go, not what you have.",
      },
    ],
  }),
  component: TriagePage,
});

const commonSymptoms = [
  "Fever",
  "Cough",
  "Headache",
  "Sore throat",
  "Nausea",
  "Abdominal pain",
  "Rash",
  "Fatigue",
];

const redFlagOptions = [
  "Chest pain or pressure",
  "Difficulty breathing",
  "Fainting or unresponsiveness",
  "Severe bleeding",
  "Sudden weakness or slurred speech",
  "Swollen tongue or lips",
];

const urgencyTone: Record<
  TriageResult["urgency"],
  { label: string; cls: string }
> = {
  emergency: {
    label: "Emergency",
    cls: "border-destructive/40 bg-destructive-soft text-destructive",
  },
  same_day: {
    label: "Same-day care",
    cls: "border-warning/40 bg-warning-soft text-warning-foreground",
  },
  routine: {
    label: "Routine appointment",
    cls: "border-primary/30 bg-primary-soft text-primary",
  },
  self_monitor: {
    label: "Monitor at home",
    cls: "border-success/35 bg-success-soft text-success",
  },
};

function TriagePage() {
  const { state } = useStore();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [durationDays, setDurationDays] = useState("2");
  const [severity, setSeverity] = useState(4);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const toggle = (list: string[], value: string, set: (v: string[]) => void) =>
    set(
      list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
    );

  const submit = async () => {
    if (symptoms.length === 0 && !freeText.trim() && redFlags.length === 0) {
      toast.error("Select at least one symptom or describe what you feel.");
      return;
    }
    setLoading(true);
    const res = await runTriage({
      symptoms,
      freeText,
      durationDays,
      severity,
      ageBand: state.profile.ageBand,
      currentMedicines: state.profile.currentMedicines,
      allergies: state.profile.allergies,
      redFlags,
      pregnancy: state.profile.pregnancyStatus,
    });
    setResult(res);
    setLoading(false);
    if (res.escalate)
      toast.warning("Warning signs selected — seek emergency care now.");
    else toast.success("Routing suggestion ready.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Symptom check"
        demo
        description="Medora suggests where to seek care and what to watch for. It never names a condition, and it is not a diagnostic device."
      />

      <EmergencyCallout />

      <form
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-5">
          <fieldset className="surface p-5">
            <legend className="px-1 text-sm font-semibold text-ink">
              What are you noticing?
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {commonSymptoms.map((s) => {
                const active = symptoms.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(symptoms, s, setSymptoms)}
                    className={
                      active
                        ? "rounded-full border border-primary bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary"
                        : "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-border-strong"
                    }
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <Label htmlFor="triage-text">Describe it in your own words</Label>
              <Textarea
                id="triage-text"
                rows={3}
                className="mt-2 resize-none"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="When it started, what makes it better or worse, anything unusual."
              />
            </div>
          </fieldset>

          <fieldset className="surface p-5">
            <legend className="px-1 text-sm font-semibold text-ink">
              Warning signs
            </legend>
            <p className="mt-1 text-sm text-muted-foreground">
              If any of these apply, Medora stops and routes you straight to
              emergency care.
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {redFlagOptions.map((f) => (
                <label key={f} className="flex items-start gap-2.5 text-sm">
                  <Checkbox
                    checked={redFlags.includes(f)}
                    onCheckedChange={() => toggle(redFlags, f, setRedFlags)}
                    aria-label={f}
                  />
                  <span>{f}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="space-y-5">
          <fieldset className="surface p-5">
            <legend className="px-1 text-sm font-semibold text-ink">
              Context
            </legend>
            <div className="mt-3 space-y-4">
              <div>
                <Label htmlFor="triage-days">
                  How many days has this lasted?
                </Label>
                <Input
                  id="triage-days"
                  type="number"
                  min={0}
                  max={365}
                  className="mt-2"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="triage-severity">
                  How severe does it feel? ({severity}/10)
                </Label>
                <Slider
                  id="triage-severity"
                  className="mt-3"
                  min={1}
                  max={10}
                  step={1}
                  value={[severity]}
                  onValueChange={(v) => setSeverity(v[0] ?? 1)}
                />
              </div>
              <div className="rounded-md border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Used from your health profile
                </p>
                <p className="mt-1">Age band {state.profile.ageBand}</p>
                <p>
                  Allergies:{" "}
                  {state.profile.allergies.join(", ") || "none recorded"}
                </p>
                <p>
                  Medicines:{" "}
                  {state.profile.currentMedicines.join(", ") || "none recorded"}
                </p>
                <Link
                  to="/app/settings"
                  className="mt-2 inline-block font-medium text-primary underline"
                >
                  Update health profile
                </Link>
              </div>
            </div>
          </fieldset>

          <Button type="submit" className="w-full" disabled={loading}>
            <Stethoscope className="size-4" aria-hidden />
            {loading
              ? "Working through your answers…"
              : "Get a routing suggestion"}
          </Button>
        </div>
      </form>

      {loading && (
        <div className="surface space-y-3 p-5">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )}

      {!loading && result && (
        <section className="space-y-5" aria-live="polite">
          {result.escalate && <EmergencyCallout />}
          <div className="surface p-5">
            <Badge
              variant="outline"
              className={urgencyTone[result.urgency].cls}
            >
              {urgencyTone[result.urgency].label}
            </Badge>
            <h2 className="mt-3 text-xl font-bold">{result.headline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {result.summary}
            </p>
          </div>

          {result.possibleExplanations.length > 0 && (
            <div className="surface p-5">
              <h3 className="text-sm font-semibold text-ink">
                Why Medora does not name a condition
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {result.possibleExplanations.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {result.monitorFor.length > 0 && (
              <div className="surface p-5">
                <h3 className="text-sm font-semibold text-ink">Watch for</h3>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {result.monitorFor.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="surface p-5">
              <h3 className="text-sm font-semibold text-ink">Seek care if</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {result.seekCareIf.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </div>

          {result.monitoringPlan.length > 0 && (
            <div className="surface p-5">
              <h3 className="text-sm font-semibold text-ink">
                A simple monitoring plan
              </h3>
              <ol className="mt-3 space-y-4">
                {result.monitoringPlan.map((step) => (
                  <li key={step.day}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {step.day}
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {step.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <SafetyNotice
            tone="warning"
            title="This is a routing suggestion, not a diagnosis"
          >
            Medora cannot examine you. If you feel worse, or you are unsure,
            contact a clinician.
          </SafetyNotice>
        </section>
      )}

      <IntegrationNotConnected integration="assistant" />
      <ClinicalDisclaimer />
    </div>
  );
}
