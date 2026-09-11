import { useState, useMemo, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Bot,
  Brain,
  Building2,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Package,
  Pill,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoMedicines, demoPrices } from "@/data/demo-catalog";
import { useStore } from "@/lib/store";
import { formatMoney, getMedicineSync } from "@/services/medicines";
import {
  explainableAi,
  type XAiMultiAgentReport,
} from "@/ai/agents/xai-engine";
import { ExplainableAiReportModal } from "@/components/ai/ExplainableAiReportModal";
import type { Medicine } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface MedicineComparativeViewProps {
  initialMedAId?: string;
  initialMedBId?: string;
  medicineIds?: string[];
  onSelectMedicine?: (medicineId: string) => void;
  className?: string;
}

export function MedicineComparativeView({
  initialMedAId,
  initialMedBId,
  medicineIds,
  className,
}: MedicineComparativeViewProps) {
  const { logActivity, toggleCompare } = useStore();
  const [xaiModalOpen, setXaiModalOpen] = useState(false);
  const [xaiReport, setXaiReport] = useState<XAiMultiAgentReport | null>(null);

  // Initialize selected medicine IDs from props or defaults
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (medicineIds && medicineIds.length > 0) {
      return medicineIds;
    }
    const list: string[] = [];
    if (initialMedAId) list.push(initialMedAId);
    if (initialMedBId && initialMedBId !== initialMedAId)
      list.push(initialMedBId);
    if (list.length === 0) {
      return ["med-dolo-650-tab", "med-calpol-650-tab", "med-crocin-650-tab"];
    }
    return list;
  });

  // Keep in sync when medicineIds prop changes
  useEffect(() => {
    if (medicineIds && medicineIds.length > 0) {
      setSelectedIds(medicineIds);
    }
  }, [medicineIds]);

  // Resolve full medicine objects
  const medicines: Medicine[] = useMemo(() => {
    return selectedIds
      .map(
        (id) => getMedicineSync(id) || demoMedicines.find((m) => m.id === id),
      )
      .filter((m): m is Medicine => Boolean(m));
  }, [selectedIds]);

  // All available medicines in catalog for selection
  const allAvailable = useMemo(() => {
    return demoMedicines;
  }, []);

  const handleAddMedicine = (id: string) => {
    if (!id || selectedIds.includes(id)) return;
    const next = [...selectedIds, id];
    setSelectedIds(next);
    const med = getMedicineSync(id) || demoMedicines.find((m) => m.id === id);
    if (med) {
      logActivity({
        action: "compare",
        title: `Added ${med.brandName} to comparison`,
        detail: `Now comparing ${next.length} medicines side-by-side.`,
      });
    }
  };

  const handleRemoveMedicine = (id: string) => {
    if (selectedIds.length <= 1) return;
    const next = selectedIds.filter((item) => item !== id);
    setSelectedIds(next);
  };

  const handleTriggerXAi = () => {
    const report = explainableAi.generateMultiAgentReport(medicines);
    setXaiReport(report);
    setXaiModalOpen(true);
    logActivity({
      action: "compare",
      title: "Explainable AI Multi-Agent Audit",
      detail: `Generated 4-agent consensus for ${medicines.length} compared medicines.`,
    });
  };

  // Equivalence analysis across all selected medicines
  const equivalenceAnalysis = useMemo(() => {
    if (medicines.length <= 1) {
      return {
        isEquivalent: true,
        composition: medicines[0]?.compositionKey || "",
        count: medicines.length,
      };
    }
    const firstKey = medicines[0]?.compositionKey;
    const allSame = medicines.every((m) => m.compositionKey === firstKey);
    return {
      isEquivalent: allSame,
      composition: firstKey || "",
      count: medicines.length,
    };
  }, [medicines]);

  // Lowest price lookup helper
  const getLowestPrice = (medId: string) => {
    const prices = demoPrices.filter((p) => p.medicineId === medId);
    if (prices.length === 0) return null;
    const min = Math.min(...prices.map((p) => p.price));
    return min;
  };

  // Unit price lookup helper
  const getUnitPrice = (medId: string, packSize: string) => {
    const minPrice = getLowestPrice(medId);
    if (!minPrice) return null;
    const num = parseInt(packSize.match(/\d+/)?.[0] || "10", 10);
    return (minPrice / (num || 1)).toFixed(2);
  };

  if (medicines.length === 0) {
    return null;
  }

  return (
    <div
      id="medicine-comparative-view"
      className={cn("rise space-y-6", className)}
    >
      {/* Explainable AI Modal Dialog */}
      <ExplainableAiReportModal
        report={xaiReport}
        open={xaiModalOpen}
        onOpenChange={setXaiModalOpen}
      />

      {/* Header & Controls */}
      <div className="surface rounded-2xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Layers className="size-4" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink flex items-center gap-2">
                  <span>Multi-Medicine Comparison Matrix</span>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs font-bold border-primary/30 text-primary bg-primary/5"
                  >
                    {medicines.length} Products Active
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Side-by-side active ingredients, clinical indications,
                  therapeutic bioequivalence, and dispensary unit economics.
                </p>
              </div>
            </div>
          </div>

          {/* Controls: XAI Button + Add Medicine Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              onClick={handleTriggerXAi}
              className="bg-gradient-to-r from-primary via-primary/90 to-emerald-600 text-primary-foreground font-bold text-xs shadow-md hover:shadow-lg transition-all"
            >
              <Brain className="mr-1.5 size-4" />
              Explain with Multi-Agent XAI
            </Button>

            <div className="flex items-center gap-1.5">
              <select
                aria-label="Add medicine to comparison"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddMedicine(e.target.value);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                className="h-9 rounded-lg border border-border bg-muted/40 px-3 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  + Add another (
                  {
                    allAvailable.filter((m) => !selectedIds.includes(m.id))
                      .length
                  }{" "}
                  available)...
                </option>
                {allAvailable
                  .filter((m) => !selectedIds.includes(m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brandName} ({m.genericName}) — {m.form}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Equivalence Verdict Banner */}
        <div
          className={cn(
            "mt-5 flex items-start gap-3 rounded-xl border p-4 text-xs transition-all",
            equivalenceAnalysis.isEquivalent
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200",
          )}
        >
          {equivalenceAnalysis.isEquivalent ? (
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px]">
                {equivalenceAnalysis.isEquivalent
                  ? "✓ 100% Bioequivalent Formulation Confirmed"
                  : "⚠ Distinct Chemical Formulations"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-mono",
                  equivalenceAnalysis.isEquivalent
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "border-amber-500/40 bg-amber-500/20 text-amber-700 dark:text-amber-300",
                )}
              >
                {equivalenceAnalysis.count} Medicines Compared
              </Badge>
            </div>
            <p className="text-xs opacity-90 leading-relaxed">
              {equivalenceAnalysis.isEquivalent ? (
                <>
                  All <strong>{medicines.length} selected medicines</strong>{" "}
                  share the identical active chemical composition (
                  <code className="font-mono font-semibold bg-emerald-500/20 px-1 py-0.5 rounded text-[11px]">
                    {equivalenceAnalysis.composition}
                  </code>
                  ). They deliver the same therapeutic efficacy and can be
                  substituted safely for cost savings.
                </>
              ) : (
                <>
                  The selected medicines contain differing active ingredients,
                  strengths, or drug classes. They are{" "}
                  <strong>not direct substitutes</strong> and have distinct
                  clinical indications. Always consult a physician or
                  pharmacist.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Responsive Multi-Column Grid (Supporting 1 to 7+ medicines) */}
      <div
        className={cn(
          "grid gap-4 items-stretch",
          medicines.length === 1 && "grid-cols-1 max-w-xl mx-auto",
          medicines.length === 2 && "grid-cols-1 md:grid-cols-2",
          medicines.length === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          medicines.length === 4 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
          medicines.length >= 5 &&
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        )}
      >
        {medicines.map((med, idx) => {
          const lowestPrice = getLowestPrice(med.id);
          const unitPrice = getUnitPrice(med.id, med.packSize);

          return (
            <div
              key={med.id}
              className="flex flex-col justify-between rounded-2xl border-2 border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="space-y-4">
                {/* Top Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {med.form} · {med.packSize}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-extrabold text-ink leading-tight">
                      {med.brandName}
                    </h3>
                    <p className="text-xs font-semibold text-primary">
                      {med.genericName}
                    </p>
                  </div>

                  {/* Remove Button if more than 1 medicine */}
                  {medicines.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMedicine(med.id)}
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove from comparison"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>

                {/* Manufacturer & Prescription Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Building2 className="size-3.5" />
                    <span className="font-medium truncate max-w-[130px]">
                      {med.manufacturer}
                    </span>
                  </div>
                  <Badge
                    variant={med.prescriptionOnly ? "destructive" : "secondary"}
                    className="text-[10px] font-bold uppercase"
                  >
                    {med.prescriptionOnly ? "Rx Only" : "OTC"}
                  </Badge>
                </div>

                {/* Price & Unit Economics */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Best Pack Price
                      </span>
                      <div className="font-display text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {lowestPrice !== null
                          ? formatMoney(lowestPrice)
                          : "₹--"}
                      </div>
                    </div>
                    {unitPrice && (
                      <div className="text-right">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Unit Cost
                        </span>
                        <div className="text-xs font-bold text-ink">
                          ₹{unitPrice} / tab
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Ingredients Section */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Pill className="size-3.5 text-primary" />
                    Active Ingredients & Strength
                  </h4>
                  <div className="space-y-1.5">
                    {med.activeIngredients.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-medium"
                      >
                        <span className="text-ink font-semibold">
                          {ing.name}
                        </span>
                        <span className="font-mono text-xs font-bold text-primary">
                          {ing.strength}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Uses Summary */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-500" />
                    Clinical Indications & Uses
                  </h4>
                  <p className="rounded-lg border border-border bg-background p-2.5 text-xs leading-relaxed text-foreground font-medium">
                    {med.usesSummary ||
                      "Indicated for fever reduction, mild-to-moderate analgesia, and symptomatic relief."}
                  </p>
                </div>

                {/* Common Side Effects */}
                {med.commonSideEffects && med.commonSideEffects.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <AlertCircle className="size-3.5 text-rose-500" />
                      Side Effect Profile
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {med.commonSideEffects.map((se, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300"
                        >
                          {se}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Warnings */}
                {med.warnings && med.warnings.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShieldAlert className="size-3.5 text-amber-600" />
                      Safety Warnings
                    </h4>
                    <ul className="space-y-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-900 dark:text-amber-200">
                      {med.warnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="mt-1 size-1 rounded-full bg-amber-500 shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 border-t border-border/60 pt-4 flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-bold"
                >
                  <Link to="/app/search">Find at Nearby Pharmacies</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
