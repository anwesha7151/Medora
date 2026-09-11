import { createFileRoute } from "@tanstack/react-router";
import { LiveGoogleSearchGrounding } from "@/components/ai/LiveGoogleSearchGrounding";
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cpu,
  FileCheck2,
  Globe,
  HelpCircle,
  Info,
  Layers,
  Pill,
  Plus,
  RefreshCcw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatTile } from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/cdss")({
  head: () => ({
    meta: [
      {
        title: "Clinical Decision Support (CDSS) — Medora Clinician Workspace",
      },
      {
        name: "description",
        content:
          "Evidence-based pharmacology support, real-time multi-drug interaction matrix, renal clearance calculators, and CDSCO Schedule H1 guidelines.",
      },
    ],
  }),
  component: DoctorCdssPage,
});

interface InteractionRule {
  drugA: string;
  drugB: string;
  severity: "contraindicated" | "major" | "moderate" | "minor";
  mechanism: string;
  clinicalImpact: string;
  recommendation: string;
  icmrGuidelineRef: string;
}

const DRUG_INTERACTIONS_DB: InteractionRule[] = [
  {
    drugA: "Metformin",
    drugB: "Iodinated Contrast Media",
    severity: "contraindicated",
    mechanism:
      "Contrast-induced nephropathy impairs metformin renal clearance, leading to accumulation.",
    clinicalImpact:
      "High risk of fatal Metformin-Associated Lactic Acidosis (MALA).",
    recommendation:
      "Withhold Metformin 48 hours prior to procedure and restart only after normal renal function confirmed.",
    icmrGuidelineRef:
      "ICMR Clinical Practice Guidelines for Type 2 Diabetes (Sec 4.2)",
  },
  {
    drugA: "Warfarin",
    drugB: "Diclofenac / Ibuprofen (NSAIDs)",
    severity: "contraindicated",
    mechanism:
      "NSAIDs inhibit platelet COX-1 and cause gastric mucosal erosions while Warfarin inhibits clotting factors.",
    clinicalImpact:
      "Severe upper gastrointestinal hemorrhage risk multiplied by 4-5x.",
    recommendation:
      "Avoid systemic NSAIDs. Use Paracetamol (up to 2g/day) or topical analgesics for pain relief.",
    icmrGuidelineRef:
      "National Formulary of India (NFI) — Anticoagulant Safety Protocols",
  },
  {
    drugA: "Atorvastatin",
    drugB: "Clarithromycin / Erythromycin",
    severity: "major",
    mechanism:
      "Potent CYP3A4 inhibition increases systemic bioavailability and AUC of Atorvastatin by 400%.",
    clinicalImpact:
      "High risk of severe myopathy and life-threatening rhabdomyolysis.",
    recommendation:
      "Temporarily suspend Statin during Macrolide course, or switch to Rosuvastatin / Azithromycin.",
    icmrGuidelineRef: "Cardiology Society of India Lipid Management Consensus",
  },
  {
    drugA: "Telmisartan / Ramipril (RAAS-I)",
    drugB: "Spironolactone",
    severity: "major",
    mechanism: "Dual suppression of aldosterone and potassium renal excretion.",
    clinicalImpact:
      "Severe hyperkalemia (K+ > 6.0 mEq/L) causing cardiac dysrhythmias.",
    recommendation:
      "Monitor serum potassium and creatinine at 1 week, 4 weeks, and quarterly. Reduce dietary K+.",
    icmrGuidelineRef: "Indian Hypertension Guidelines (IHW-IV)",
  },
  {
    drugA: "Ciprofloxacin",
    drugB: "Antacids (Aluminium/Magnesium Hydroxide)",
    severity: "moderate",
    mechanism:
      "Formation of insoluble chelate complexes in the gut prevents fluoroquinolone absorption.",
    clinicalImpact:
      "Up to 90% reduction in antibiotic efficacy; clinical treatment failure.",
    recommendation:
      "Administer Ciprofloxacin at least 2 hours before or 6 hours after any antacid or mineral supplement.",
    icmrGuidelineRef: "ICMR Antimicrobial Treatment Guidelines 2024",
  },
];

const COMMON_DRUGS = [
  "Metformin",
  "Iodinated Contrast Media",
  "Warfarin",
  "Diclofenac / Ibuprofen (NSAIDs)",
  "Atorvastatin",
  "Clarithromycin / Erythromycin",
  "Telmisartan / Ramipril (RAAS-I)",
  "Spironolactone",
  "Ciprofloxacin",
  "Antacids (Aluminium/Magnesium Hydroxide)",
  "Paracetamol",
  "Amlodipine",
  "Azithromycin",
  "Levothyroxine",
];

function DoctorCdssPage() {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([
    "Metformin",
    "Iodinated Contrast Media",
  ]);
  const [drugToAdd, setDrugToAdd] = useState<string>("");

  // Renal Calculator States
  const [patientAge, setPatientAge] = useState<string>("62");
  const [patientWeight, setPatientWeight] = useState<string>("68");
  const [patientGender, setPatientGender] = useState<"male" | "female">("male");
  const [serumCreatinine, setSerumCreatinine] = useState<string>("1.8");

  // Calculate Cockcroft-Gault CrCl
  const calculatedCrCl = useMemo(() => {
    const age = parseFloat(patientAge) || 0;
    const weight = parseFloat(patientWeight) || 0;
    const sCr = parseFloat(serumCreatinine) || 0;

    if (age <= 0 || weight <= 0 || sCr <= 0) return 0;

    let crcl = ((140 - age) * weight) / (72 * sCr);
    if (patientGender === "female") crcl *= 0.85;

    return Math.round(crcl * 10) / 10;
  }, [patientAge, patientWeight, patientGender, serumCreatinine]);

  // Detected Interactions
  const detectedInteractions = useMemo(() => {
    const results: InteractionRule[] = [];
    for (let i = 0; i < selectedDrugs.length; i++) {
      for (let j = i + 1; j < selectedDrugs.length; j++) {
        const d1 = selectedDrugs[i];
        const d2 = selectedDrugs[j];

        const match = DRUG_INTERACTIONS_DB.find(
          (rule) =>
            (rule.drugA === d1 && rule.drugB === d2) ||
            (rule.drugA === d2 && rule.drugB === d1),
        );
        if (match) results.push(match);
      }
    }
    return results;
  }, [selectedDrugs]);

  const handleAddDrug = (name: string) => {
    if (!name || selectedDrugs.includes(name)) return;
    if (selectedDrugs.length >= 6) {
      toast.error("Maximum 6 medicines at a time in matrix.");
      return;
    }
    setSelectedDrugs([...selectedDrugs, name]);
    setDrugToAdd("");
    toast.success(`Added ${name} to interaction matrix.`);
  };

  const handleRemoveDrug = (name: string) => {
    setSelectedDrugs(selectedDrugs.filter((d) => d !== name));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Decision Support (CDSS)"
        description="Verify multi-drug interaction contraindications, calculate renal dosage clearances, and align with ICMR National Treatment Guidelines."
        actions={
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary font-bold text-xs"
          >
            CDSS Knowledgebase v2026.8
          </Badge>
        }
      />

      {/* Main Tabs */}
      <Tabs defaultValue="interactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl h-auto p-1 rounded-2xl bg-muted/60 gap-1">
          <TabsTrigger
            value="interactions"
            className="rounded-xl text-xs font-bold gap-1.5 py-2"
          >
            <ShieldAlert className="size-3.5" /> Interaction Matrix
          </TabsTrigger>
          <TabsTrigger
            value="grounding"
            className="rounded-xl text-xs font-bold gap-1.5 py-2 text-primary data-[state=active]:text-primary"
          >
            <Globe className="size-3.5" /> Live Search Grounding
          </TabsTrigger>
          <TabsTrigger
            value="renal"
            className="rounded-xl text-xs font-bold gap-1.5 py-2"
          >
            <Calculator className="size-3.5" /> Renal Dosing
          </TabsTrigger>
          <TabsTrigger
            value="guidelines"
            className="rounded-xl text-xs font-bold gap-1.5 py-2"
          >
            <BookOpen className="size-3.5" /> ICMR Guidelines
          </TabsTrigger>
        </TabsList>

        {/* 1. INTERACTION MATRIX TAB */}
        <TabsContent value="interactions" className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <Pill className="size-4 text-primary" /> Active Prescription
                  Regimen to Test
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select medications to check for drug-drug interactions, CYP450
                  metabolism collisions, and blackbox warnings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Select value={drugToAdd} onValueChange={handleAddDrug}>
                  <SelectTrigger className="h-9 text-xs rounded-xl w-[220px]">
                    <SelectValue placeholder="+ Add drug to check…" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_DRUGS.filter((d) => !selectedDrugs.includes(d)).map(
                      (drug) => (
                        <SelectItem key={drug} value={drug} className="text-xs">
                          {drug}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                {selectedDrugs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDrugs([])}
                    className="h-9 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Drug Chips */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              {selectedDrugs.map((drug) => (
                <span
                  key={drug}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary shadow-2xs"
                >
                  <Pill className="size-3" />
                  {drug}
                  <button
                    type="button"
                    onClick={() => handleRemoveDrug(drug)}
                    className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {selectedDrugs.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-1">
                  No drugs added yet. Pick medications from the dropdown above.
                </p>
              )}
            </div>
          </div>

          {/* Interaction Findings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base text-foreground flex items-center gap-2">
                <ShieldAlert className="size-4 text-primary" />
                Detected Clinical Interactions ({detectedInteractions.length})
              </h3>
              {detectedInteractions.length > 0 && (
                <Badge variant="destructive" className="font-bold text-xs">
                  {
                    detectedInteractions.filter(
                      (i) => i.severity === "contraindicated",
                    ).length
                  }{" "}
                  Contraindicated Pairings
                </Badge>
              )}
            </div>

            {detectedInteractions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-xs">
                <CheckCircle2 className="size-10 text-emerald-500 mb-2" />
                <h4 className="font-display font-bold text-base text-foreground">
                  No Harmful Interactions Detected
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  The current combination of medications has no major or
                  contraindicated pharmacology clashes in the CDSS
                  knowledgebase.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {detectedInteractions.map((item, idx) => {
                  const isContraindicated = item.severity === "contraindicated";
                  const isMajor = item.severity === "major";

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-2xl border p-5 shadow-xs space-y-4 bg-card transition-all",
                        isContraindicated &&
                          "border-destructive/50 bg-gradient-to-br from-destructive/5 via-card to-card",
                        isMajor &&
                          "border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-card to-card",
                        !isContraindicated && !isMajor && "border-sky-500/40",
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-sm text-foreground">
                            {item.drugA}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            +
                          </span>
                          <span className="font-display font-extrabold text-sm text-foreground">
                            {item.drugB}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full w-fit",
                            isContraindicated &&
                              "border-destructive bg-destructive/10 text-destructive",
                            isMajor &&
                              "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                            !isContraindicated &&
                              !isMajor &&
                              "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                          )}
                        >
                          {item.severity}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                            Pharmacological Mechanism
                          </span>
                          <p className="text-foreground leading-relaxed">
                            {item.mechanism}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                            Clinical Hazard
                          </span>
                          <p className="text-destructive font-medium leading-relaxed">
                            {item.clinicalImpact}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-primary font-bold">
                          <Sparkles className="size-3.5" /> Clinician Action
                          Recommendation
                        </div>
                        <p className="text-foreground font-medium">
                          {item.recommendation}
                        </p>
                        <p className="text-[10px] text-muted-foreground pt-1 border-t border-primary/10">
                          Ref: {item.icmrGuidelineRef}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 2. LIVE GOOGLE SEARCH GROUNDING TAB */}
        <TabsContent value="grounding" className="space-y-6">
          <LiveGoogleSearchGrounding
            initialContextType="drug_safety"
            patientContext="Clinician Clinical Decision Support Consultation. Focus on CDSCO/FDA safety alerts, recent clinical trials, and pharmacology interactions."
          />
        </TabsContent>

        {/* 3. RENAL DOSING CALCULATOR TAB */}
        <TabsContent value="renal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 md:col-span-1">
              <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                <Calculator className="size-4 text-primary" /> Patient Renal
                Parameters
              </h3>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Age (years)</Label>
                  <Input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Weight (kg)</Label>
                  <Input
                    type="number"
                    value={patientWeight}
                    onChange={(e) => setPatientWeight(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Biological Sex
                  </Label>
                  <Select
                    value={patientGender}
                    onValueChange={(v) =>
                      setPatientGender(v as "male" | "female")
                    }
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">
                        Female (x0.85 coefficient)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Serum Creatinine (mg/dL)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={serumCreatinine}
                    onChange={(e) => setSerumCreatinine(e.target.value)}
                    className="h-9 text-xs rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Result & Drug Adjustments */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-5 md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Estimated Creatinine Clearance (CrCl)
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={cn(
                        "text-4xl font-black font-display",
                        calculatedCrCl < 30
                          ? "text-destructive"
                          : calculatedCrCl < 60
                            ? "text-amber-600"
                            : "text-emerald-600",
                      )}
                    >
                      {calculatedCrCl}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground">
                      mL/min
                    </span>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full w-fit",
                    calculatedCrCl < 15 &&
                      "border-destructive bg-destructive/10 text-destructive",
                    calculatedCrCl >= 15 &&
                      calculatedCrCl < 30 &&
                      "border-destructive/60 bg-destructive/5 text-destructive",
                    calculatedCrCl >= 30 &&
                      calculatedCrCl < 60 &&
                      "border-amber-500/60 bg-amber-500/10 text-amber-700",
                    calculatedCrCl >= 60 &&
                      "border-emerald-500/60 bg-emerald-500/10 text-emerald-700",
                  )}
                >
                  {calculatedCrCl < 15
                    ? "Stage 5 CKD (Kidney Failure)"
                    : calculatedCrCl < 30
                      ? "Stage 4 CKD (Severe Impairment)"
                      : calculatedCrCl < 60
                        ? "Stage 3 CKD (Moderate Impairment)"
                        : "Normal / Mild Impairment"}
                </Badge>
              </div>

              {/* Specific Drug Adjustment Matrix */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">
                  Automatic Dosage Adjustments for CrCl {calculatedCrCl} mL/min
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-foreground">Metformin</strong>
                      <p className="text-muted-foreground mt-0.5">
                        {calculatedCrCl < 30
                          ? "❌ Strictly CONTRAINDICATED (High Lactic Acidosis risk)."
                          : calculatedCrCl < 45
                            ? "⚠️ Max dose 1,000 mg/day (500mg BID). Monitor renal panel every 3 months."
                            : "✅ Normal dosing (up to 2,000 mg/day)."}
                      </p>
                    </div>
                    <Badge
                      variant={calculatedCrCl < 30 ? "destructive" : "outline"}
                      className="text-[10px] shrink-0 font-bold"
                    >
                      {calculatedCrCl < 30
                        ? "Contraindicated"
                        : calculatedCrCl < 45
                          ? "Dose Limit"
                          : "Standard"}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-foreground">Ciprofloxacin</strong>
                      <p className="text-muted-foreground mt-0.5">
                        {calculatedCrCl < 30
                          ? "⚠️ Reduce dose by 50% or 250-500 mg q18h."
                          : "✅ Standard 500 mg q12h."}
                      </p>
                    </div>
                    <Badge
                      variant={calculatedCrCl < 30 ? "outline" : "outline"}
                      className="text-[10px] shrink-0 font-bold"
                    >
                      {calculatedCrCl < 30 ? "Adjust q18h" : "Standard"}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-foreground">
                        Enoxaparin (LMWH)
                      </strong>
                      <p className="text-muted-foreground mt-0.5">
                        {calculatedCrCl < 30
                          ? "⚠️ Reduce therapeutic dose to 1 mg/kg once daily (from 1 mg/kg BID)."
                          : "✅ Standard 1 mg/kg BID."}
                      </p>
                    </div>
                    <Badge
                      variant={calculatedCrCl < 30 ? "outline" : "outline"}
                      className="text-[10px] shrink-0 font-bold"
                    >
                      {calculatedCrCl < 30 ? "Once Daily" : "Standard"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 3. ICMR GUIDELINES TAB */}
        <TabsContent value="guidelines" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="size-4" /> CDSCO Schedule H1 Regulations
              </div>
              <h4 className="font-display font-extrabold text-sm text-foreground">
                Mandatory Schedule H1 Register Protocols
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Under the Drugs and Cosmetics Rules, 3rd / 4th generation
                cephalosporins, carbapenems, fluoroquinolones, and anti-TB drugs
                require separate Schedule H1 registers with doctor license
                number, patient address, and 3-year record retention.
              </p>
              <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
                <p className="font-semibold text-foreground">
                  Key Drugs Included:
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Meropenem, Ceftriaxone, Levofloxacin, Linezolid, Moxifloxacin,
                  Bedaquiline, Tramadol, Alprazolam.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <FileCheck2 className="size-4" /> ICMR Antimicrobial Stewardship
                2024
              </div>
              <h4 className="font-display font-extrabold text-sm text-foreground">
                AWaRe Antibiotic Protocol Guidelines
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Prioritize 'Access' group antibiotics (Amoxicillin, Doxycycline)
                for initial empirical therapy. Reserve 'Watch' and 'Reserve'
                antibiotics (Colistin, Polymyxin B) exclusively for
                culture-proven multi-drug resistant pathogens.
              </p>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <strong>Hospital/Clinic Target:</strong> &ge; 60% of all
                antimicrobial prescriptions from Access category.
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
