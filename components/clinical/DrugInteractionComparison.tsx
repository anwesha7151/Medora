import { useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Info,
  Layers,
  Pill,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClinicalDisclaimer,
  DemoBadge,
  SafetyNotice,
} from "@/components/common/primitives";
import {
  analyzeDrugList,
  DRUG_SAFETY_DATABASE,
  findDrugProfile,
  type DrugSafetyProfile,
} from "@/data/clinical-interactions";
import { demoMedicines } from "@/data/demo-catalog";
import { useStore } from "@/lib/store";

const PRESET_COMBOS = [
  {
    name: "Diabetes + Pain Caution",
    description: "Metformin + Ibuprofen (Renal clearance check)",
    meds: ["Metformin hydrochloride", "Ibuprofen"],
  },
  {
    name: "Cardiovascular Stack",
    description: "Aspirin + Ibuprofen (Antiplatelet competition)",
    meds: ["Aspirin", "Ibuprofen", "Atorvastatin"],
  },
  {
    name: "Duplicate Cold/Flu Risk",
    description: "Panacet 500 + Feverol (Accidental paracetamol doubling)",
    meds: ["Panacet 500", "Feverol"],
  },
  {
    name: "Respiratory & Allergy Duo",
    description: "Salbutamol + Cetirizine (Safe bronchial co-management)",
    meds: ["Salbutamol", "Cetirizine hydrochloride"],
  },
];

export function DrugInteractionComparisonDashboard() {
  const { state } = useStore();
  const [selectedMeds, setSelectedMeds] = useState<string[]>([
    "Metformin hydrochloride 500 mg",
    "Ibuprofen",
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSideEffectFilter, setSelectedSideEffectFilter] =
    useState<string>("all");
  const [reportOpen, setReportOpen] = useState(false);

  // Suggested catalogue items for search
  const suggestions = searchQuery.trim()
    ? [
        ...demoMedicines.map((m) => m.brandName),
        ...demoMedicines.map((m) => m.genericName),
        "Aspirin",
        "Atorvastatin",
        "Ibuprofen",
        "Paracetamol",
      ]
        .filter((name, idx, self) => self.indexOf(name) === idx)
        .filter(
          (name) =>
            name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !selectedMeds.some((m) =>
              m.toLowerCase().includes(name.toLowerCase()),
            ),
        )
        .slice(0, 6)
    : [];

  const addMedicine = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (selectedMeds.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Medicine is already in your comparison deck.");
      return;
    }
    if (selectedMeds.length >= 6) {
      toast.error("Maximum 6 medications can be compared at once.");
      return;
    }
    setSelectedMeds((prev) => [...prev, trimmed]);
    setSearchQuery("");
    toast.success(`Added ${trimmed} to interaction analysis.`);
  };

  const removeMedicine = (index: number) => {
    setSelectedMeds((prev) => prev.filter((_, i) => i !== index));
  };

  const resetToProfile = () => {
    if (state.profile.currentMedicines.length) {
      setSelectedMeds([...state.profile.currentMedicines]);
      toast.success("Loaded current medications from your profile.");
    } else {
      setSelectedMeds(["Paracetamol", "Ibuprofen"]);
      toast.info("No current medications in profile; reset to sample pair.");
    }
  };

  const analysis = analyzeDrugList(selectedMeds, state.profile.allergies);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 65) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85)
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-500/30">
          <ShieldCheck className="size-3 mr-1 inline" /> Clean Profile
        </Badge>
      );
    if (score >= 65)
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-500/30">
          <AlertTriangle className="size-3 mr-1 inline" /> Requires Review
        </Badge>
      );
    return (
      <Badge variant="destructive">
        <ShieldAlert className="size-3 mr-1 inline" /> High-Risk Flags
      </Badge>
    );
  };

  const downloadReport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      patient: state.profile.fullName,
      allergiesRecorded: state.profile.allergies,
      analyzedMedications: selectedMeds,
      safetyScore: analysis.safetyScore,
      duplicateIngredients: analysis.duplicateIngredients,
      interactionsDetected: analysis.interactions,
      allergyFlags: analysis.allergyWarnings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Medora-Clinical-Interaction-Review-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Clinical safety report exported successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner incorporating @utility hero-wash */}
      <section className="hero-wash relative overflow-hidden rounded-2xl border border-border p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                <Stethoscope className="size-3.5" /> Clinical Safety Engine
              </span>
              <DemoBadge label="Verified Pharmacology Matrix" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              Drug Interaction & Safety Comparison
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Evaluate multi-medication compatibility, side effects,
              contraindications, and duplicate active ingredients with
              deterministic clinical pharmacology rules.
            </p>
          </div>

          {/* Real-time Safety Meter */}
          <div className="flex shrink-0 flex-col items-start gap-3 rounded-xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur sm:items-end lg:w-72">
            <div className="flex w-full items-center justify-between sm:justify-end sm:gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Compatibility Score
              </span>
              {getScoreBadge(analysis.safetyScore)}
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-4xl font-extrabold tracking-tight ${getScoreColor(analysis.safetyScore)}`}
              >
                {analysis.safetyScore}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.interactions.length === 0 &&
              analysis.duplicateIngredients.length === 0
                ? "No known antagonistic interactions detected in selection."
                : `${analysis.interactions.length} interaction${analysis.interactions.length === 1 ? "" : "s"} & ${analysis.duplicateIngredients.length} duplicate${analysis.duplicateIngredients.length === 1 ? "" : "s"} flagged.`}
            </p>
            <div className="flex w-full gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setReportOpen(true)}
              >
                <Printer className="size-3.5 mr-1" /> View Summary
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={downloadReport}
              >
                <Download className="size-3.5 mr-1" /> Export
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Combination Presets */}
      <section className="surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              Clinical Test Scenarios
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Click any test combination to inspect real-time pharmacology
            findings
          </span>
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PRESET_COMBOS.map((combo) => (
            <button
              key={combo.name}
              type="button"
              onClick={() => {
                setSelectedMeds(combo.meds);
                toast.success(`Loaded preset: ${combo.name}`);
              }}
              className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card/60 p-3 text-left transition-all hover:border-primary hover:bg-primary-soft/30"
            >
              <span className="text-xs font-bold text-ink">{combo.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {combo.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Medication Search & Active Deck */}
      <div className="surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">
              Active Medication Deck
            </h2>
            <p className="text-xs text-muted-foreground">
              Search and add brand names, generic substances, or ingredients to
              compare.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToProfile}
              className="text-xs"
            >
              <RotateCcw className="size-3.5 mr-1" /> Load Profile Meds
            </Button>
            {selectedMeds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMeds([])}
                className="text-xs text-destructive hover:bg-destructive-soft"
              >
                <Trash2 className="size-3.5 mr-1" /> Clear Deck
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar with Autocomplete */}
        <div className="relative mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    e.preventDefault();
                    addMedicine(searchQuery);
                  }
                }}
                placeholder="Type brand or generic name (e.g. Paracetamol, Metformin, Aspirin, Ibuprofen, Atorvastatin)..."
                className="pl-9 text-sm"
              />
            </div>
            <Button
              onClick={() => addMedicine(searchQuery)}
              disabled={!searchQuery.trim()}
            >
              <Plus className="size-4 mr-1" /> Add
            </Button>
          </div>

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-lg border border-border bg-popover p-1 shadow-lg backdrop-blur">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                Suggested Catalogue Matches:
              </div>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addMedicine(s)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <span>{s}</span>
                  <span className="text-[10px] text-muted-foreground">
                    Add to deck +
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Medication Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {selectedMeds.map((med, index) => {
            const profile = findDrugProfile(med);
            return (
              <div
                key={`${med}-${index}`}
                className="flex items-center gap-2 rounded-full border border-border-strong bg-secondary/80 py-1.5 pl-3 pr-2 text-xs font-medium text-foreground transition-all hover:bg-secondary"
              >
                <Pill className="size-3.5 text-primary" />
                <span className="font-semibold text-ink">{med}</span>
                {profile && profile.drugClass && (
                  <span className="hidden text-[10px] text-muted-foreground sm:inline">
                    ({(profile.drugClass || "").split(" ")[0]})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeMedicine(index)}
                  className="ml-1 grid size-4 place-items-center rounded-full hover:bg-destructive-soft hover:text-destructive"
                  aria-label={`Remove ${med}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
          {selectedMeds.length === 0 && (
            <p className="text-xs italic text-muted-foreground">
              Your deck is empty. Add at least two medications above or pick a
              test scenario to begin.
            </p>
          )}
        </div>
      </div>

      {/* Main Analysis Sections */}
      {selectedMeds.length > 0 && (
        <Tabs defaultValue="interactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
            <TabsTrigger value="interactions" className="gap-2">
              <ShieldAlert className="size-4" />
              Interactions & Alerts (
              {analysis.interactions.length +
                analysis.duplicateIngredients.length +
                analysis.allergyWarnings.length}
              )
            </TabsTrigger>
            <TabsTrigger value="side-effects" className="gap-2">
              <AlertTriangle className="size-4" />
              Side Effects Matrix
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <ArrowRightLeft className="size-4" />
              Pharmacology Table
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: INTERACTIONS & ALERTS */}
          <TabsContent value="interactions" className="space-y-4">
            {/* Allergy Match Alerts */}
            {analysis.allergyWarnings.length > 0 && (
              <div className="rounded-xl border border-destructive/40 bg-destructive-soft/50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-destructive">
                      Allergy Warning: Profile Match Detected
                    </h3>
                    <p className="text-xs leading-relaxed text-destructive-foreground/90">
                      The following medication(s) match an allergy recorded in
                      your health profile. Do not take without direct clinician
                      consultation.
                    </p>
                    <div className="space-y-1">
                      {analysis.allergyWarnings.map((w, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs font-semibold text-destructive"
                        >
                          <span className="size-1.5 rounded-full bg-destructive" />
                          <span>{w.matchedMedicine}</span> matches recorded
                          allergy:{" "}
                          <span className="underline">{w.allergy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Ingredient Alerts */}
            {analysis.duplicateIngredients.length > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
                <div className="flex items-start gap-3">
                  <Layers className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Duplicate Active Ingredient Warning
                    </h3>
                    <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                      You have selected multiple products containing the same
                      active substance. Concurrent use risks accidental
                      overdose.
                    </p>
                    {analysis.duplicateIngredients.map((dup, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-amber-500/30 bg-card/60 p-3"
                      >
                        <p className="text-xs font-bold text-ink">
                          Active Ingredient: {dup.ingredient}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Present in: {dup.medicines.join(" AND ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Drug-Drug Interactions */}
            {analysis.interactions.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-ink">
                  Pharmacological Drug-Drug Interactions (
                  {analysis.interactions.length})
                </h3>
                {analysis.interactions.map((rule) => {
                  const isSevere = rule.severity === "severe";
                  const isModerate = rule.severity === "moderate";

                  return (
                    <div
                      key={rule.id}
                      className={`surface p-5 transition-all ${
                        isSevere
                          ? "border-destructive/40 bg-destructive-soft/10"
                          : isModerate
                            ? "border-amber-500/40 bg-amber-500/5"
                            : "border-border"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              isSevere
                                ? "destructive"
                                : isModerate
                                  ? "outline"
                                  : "secondary"
                            }
                            className={
                              isModerate
                                ? "border-amber-500 text-amber-700 dark:text-amber-300"
                                : ""
                            }
                          >
                            {rule.severity.toUpperCase()} RISK
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">
                            Evidence: {rule.evidenceLevel}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-ink">
                          {rule.drugs[0].toUpperCase()} ↔{" "}
                          {rule.drugs[1].toUpperCase()}
                        </span>
                      </div>

                      <h4 className="mt-3 text-sm font-bold text-ink">
                        {rule.title}
                      </h4>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border bg-card/50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Pharmacological Mechanism
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-foreground">
                            {rule.mechanism}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-card/50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                            Clinical Recommendation
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-foreground font-medium">
                            {rule.clinicalAdvice}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="surface flex flex-col items-center justify-center p-8 text-center">
                <div className="grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-ink">
                  No Antagonistic Drug-Drug Interactions Detected
                </h3>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                  The selected medications do not have known major
                  pharmacological clashes in the verified reference matrix.
                  Always consult your prescriber.
                </p>
              </div>
            )}

            {/* Food & Lifestyle Precaution Cards */}
            <div className="surface p-5">
              <div className="flex items-center gap-2">
                <Utensils className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-ink">
                  Dietary, Food & Lifestyle Precautions
                </h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analysis.profiles.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-border bg-card p-3.5 space-y-2"
                  >
                    <p className="text-xs font-bold text-ink">{p.name}</p>
                    <div className="space-y-1">
                      {p.foodInteractions.map((f, i) => (
                        <p
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="mt-1 size-1 rounded-full bg-amber-500 shrink-0" />
                          <span>{f}</span>
                        </p>
                      ))}
                      {p.lifestyleCautions.map((l, i) => (
                        <p
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="mt-1 size-1 rounded-full bg-primary shrink-0" />
                          <span>{l}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SIDE EFFECTS MATRIX */}
          <TabsContent value="side-effects" className="space-y-4">
            <div className="surface p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    Side Effect Profiles by Organ System
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Compare frequency and biological systems affected across
                    your active medications.
                  </p>
                </div>
                {/* Organ Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="size-3.5 text-muted-foreground" />
                  <Select
                    value={selectedSideEffectFilter}
                    onValueChange={setSelectedSideEffectFilter}
                  >
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <SelectValue placeholder="All Organ Systems" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Systems</SelectItem>
                      <SelectItem value="GI">Gastrointestinal (GI)</SelectItem>
                      <SelectItem value="CNS">
                        Central Nervous System
                      </SelectItem>
                      <SelectItem value="Cardio">Cardiovascular</SelectItem>
                      <SelectItem value="Derma">Dermatological</SelectItem>
                      <SelectItem value="Metabolic">
                        Metabolic & Liver
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Side Effect Cards per Drug */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {analysis.profiles.map((p) => {
                  const filteredEffects = p.commonSideEffects.filter(
                    (e) =>
                      selectedSideEffectFilter === "all" ||
                      e.system === selectedSideEffectFilter,
                  );

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-ink">
                            {p.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {p.drugClass}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {p.form}
                        </Badge>
                      </div>

                      <div className="mt-3 flex-1 space-y-2.5">
                        {filteredEffects.length > 0 ? (
                          filteredEffects.map((se, idx) => (
                            <div
                              key={idx}
                              className="rounded-md border border-border/70 bg-secondary/40 p-2.5"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-ink">
                                  {se.system} System
                                </span>
                                <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {se.frequency}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-foreground">
                                {se.effect}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="py-4 text-center text-xs italic text-muted-foreground">
                            No side effects documented for this organ filter in
                            this record.
                          </p>
                        )}
                      </div>

                      {p.blackBoxWarning && (
                        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive-soft/40 p-2.5 text-[11px] text-destructive">
                          <p className="font-bold flex items-center gap-1">
                            <ShieldAlert className="size-3" /> Important Alert
                          </p>
                          <p className="mt-0.5 line-clamp-3">
                            {p.blackBoxWarning}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: PHARMACOLOGY TABLE */}
          <TabsContent value="comparison" className="space-y-4">
            <div className="surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-3.5">Parameter</th>
                      {analysis.profiles.map((p) => (
                        <th
                          key={p.id}
                          className="min-w-[200px] p-3.5 text-ink font-bold"
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-3.5 font-semibold text-muted-foreground bg-secondary/20">
                        Generic Name
                      </td>
                      {analysis.profiles.map((p) => (
                        <td
                          key={p.id}
                          className="p-3.5 font-medium text-foreground"
                        >
                          {p.genericName}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-muted-foreground bg-secondary/20">
                        Drug Class
                      </td>
                      {analysis.profiles.map((p) => (
                        <td key={p.id} className="p-3.5 text-foreground">
                          {p.drugClass}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-muted-foreground bg-secondary/20">
                        Mechanism of Action
                      </td>
                      {analysis.profiles.map((p) => (
                        <td
                          key={p.id}
                          className="p-3.5 text-xs text-muted-foreground leading-relaxed"
                        >
                          {p.mechanism}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-muted-foreground bg-secondary/20">
                        Elimination Half-life
                      </td>
                      {analysis.profiles.map((p) => (
                        <td
                          key={p.id}
                          className="p-3.5 font-mono text-xs text-foreground"
                        >
                          {p.eliminationHalfLife}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-muted-foreground bg-secondary/20">
                        Pregnancy Category
                      </td>
                      {analysis.profiles.map((p) => (
                        <td key={p.id} className="p-3.5">
                          <span
                            className={`inline-block rounded px-2 py-0.5 font-bold ${
                              p.pregnancyCategory === "X"
                                ? "bg-destructive text-destructive-foreground"
                                : p.pregnancyCategory === "D"
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                  : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            Category {p.pregnancyCategory}
                          </span>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {p.pregnancyNote}
                          </p>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-muted-foreground bg-secondary/20">
                        Lactation Safety
                      </td>
                      {analysis.profiles.map((p) => (
                        <td
                          key={p.id}
                          className="p-3.5 font-medium text-foreground"
                        >
                          {p.lactationSafety}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-muted-foreground bg-secondary/20">
                        Renal & Hepatic Notes
                      </td>
                      {analysis.profiles.map((p) => (
                        <td
                          key={p.id}
                          className="p-3.5 text-xs text-muted-foreground"
                        >
                          <p>
                            <strong className="text-ink">Renal:</strong>{" "}
                            {p.renalAdjustment}
                          </p>
                          <p className="mt-1">
                            <strong className="text-ink">
                              Hepatic Caution:
                            </strong>{" "}
                            {p.hepaticPrecaution}
                          </p>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-muted-foreground bg-secondary/20">
                        Prescription Status
                      </td>
                      {analysis.profiles.map((p) => (
                        <td key={p.id} className="p-3.5">
                          <Badge
                            variant={
                              p.prescriptionOnly ? "default" : "secondary"
                            }
                          >
                            {p.prescriptionOnly
                              ? "Rx Required"
                              : "Over the Counter (OTC)"}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Structured Clinical Review Modal */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Medora Clinical Safety Review Sheet</DialogTitle>
            <DialogDescription>
              A printable summary of drug interactions, duplicate ingredients,
              and contraindications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
            <div className="rounded-lg border border-border p-3.5 bg-secondary/30">
              <p className="font-bold text-ink">
                Patient: {state.profile.fullName}
              </p>
              <p className="text-muted-foreground">
                Recorded Allergies:{" "}
                {state.profile.allergies.join(", ") || "None recorded"}
              </p>
              <p className="text-muted-foreground">
                Generated at: {new Date().toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-ink">
                1. Selected Medications ({selectedMeds.length})
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {selectedMeds.map((m, i) => (
                  <li key={i}>
                    <span className="text-ink font-medium">{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-ink">2. Safety Score & Findings</h4>
              <p className="text-foreground">
                Score:{" "}
                <strong className={getScoreColor(analysis.safetyScore)}>
                  {analysis.safetyScore} / 100
                </strong>
              </p>
              {analysis.interactions.length > 0 ? (
                <div className="space-y-1.5">
                  {analysis.interactions.map((int, idx) => (
                    <div key={idx} className="rounded border p-2 border-border">
                      <span className="font-bold text-destructive">
                        [{int.severity.toUpperCase()}] {int.title}
                      </span>
                      <p className="mt-0.5 text-muted-foreground">
                        {int.clinicalAdvice}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                  No major drug-drug clashes detected in database.
                </p>
              )}
            </div>

            <SafetyNotice title="Clinical Disclaimer">
              This summary is informational. Take this sheet to your doctor or
              dispensing pharmacist before starting or modifying any treatment
              regimen.
            </SafetyNotice>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-3.5 mr-1" /> Print
            </Button>
            <Button size="sm" onClick={() => setReportOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ClinicalDisclaimer />
    </div>
  );
}
