import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Microscope,
  Pill,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { XAiMultiAgentReport } from "@/ai/agents/xai-engine";
import { formatMoney } from "@/services/medicines";
import { cn } from "@/lib/utils";

interface ExplainableAiReportModalProps {
  report: XAiMultiAgentReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExplainableAiReportModal({
  report,
  open,
  onOpenChange,
}: ExplainableAiReportModalProps) {
  const [activeTab, setActiveTab] = useState<
    "summary" | "chain" | "agents" | "pharmacology"
  >("summary");
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-2 border-border bg-card shadow-2xl">
        {/* Header with AI Gradient & Confidence Badge */}
        <div className="relative overflow-hidden border-b border-border/80 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/20 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-primary">
                  <Brain className="size-3.5" />
                  Medora Explainable AI (XAI)
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-xs border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                >
                  <ShieldCheck className="mr-1 size-3" />
                  {report.overallConfidence}% Calibrated Confidence
                </Badge>
              </div>
              <DialogTitle className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                {report.primaryTitle}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Deterministic multi-agent reasoning with full chain-of-thought
                provenance and clinical citations.
              </DialogDescription>
            </div>
          </div>

          {/* Quick Confidence Bar */}
          <div className="mt-5 rounded-2xl border border-border/60 bg-background/80 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-ink">
                <Bot className="size-4 text-primary" />
                Multi-Agent Consensus Index
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {report.overallConfidence}/100 High Certainty
              </span>
            </div>
            <Progress
              value={report.overallConfidence}
              className="h-2 bg-muted"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-6 sm:p-8 space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={(v: any) => setActiveTab(v)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 h-11 p-1 bg-muted/50 rounded-xl border border-border">
              <TabsTrigger
                value="summary"
                className="text-xs font-bold rounded-lg"
              >
                <Lightbulb className="mr-1.5 size-3.5" />
                Executive Summary
              </TabsTrigger>
              <TabsTrigger
                value="chain"
                className="text-xs font-bold rounded-lg"
              >
                <Layers className="mr-1.5 size-3.5" />
                Reasoning Chain ({report.decisionChain.length})
              </TabsTrigger>
              <TabsTrigger
                value="agents"
                className="text-xs font-bold rounded-lg"
              >
                <Bot className="mr-1.5 size-3.5" />
                Agent Votes (4)
              </TabsTrigger>
              <TabsTrigger
                value="pharmacology"
                className="text-xs font-bold rounded-lg"
              >
                <Microscope className="mr-1.5 size-3.5" />
                Clinical Deep Dive
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: EXECUTIVE SUMMARY */}
            <TabsContent value="summary" className="space-y-6 pt-4">
              {/* Verdict Card */}
              <div
                className={cn(
                  "rounded-2xl border-2 p-5 space-y-3",
                  report.equivalenceVerdict.isEquivalent
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
                    : "border-amber-500/40 bg-amber-500/5 text-amber-950 dark:text-amber-200",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {report.equivalenceVerdict.isEquivalent ? (
                      <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400" />
                    )}
                    <h3 className="font-display text-base font-extrabold text-ink">
                      {report.equivalenceVerdict.summary}
                    </h3>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {report.targetMedicineIds.length} Medicines Analyzed
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium">
                  {report.plainLanguageSummary}
                </p>
              </div>

              {/* Economic Arbitrage & Savings Insight */}
              {report.economicSavingsInsight && (
                <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-extrabold text-xs uppercase tracking-wider">
                    <DollarSign className="size-4" />
                    Economic Arbitrage & Cost Optimization
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Cheapest Brand
                      </span>
                      <div className="font-display text-base font-bold text-ink truncate">
                        {report.economicSavingsInsight.cheapestBrand}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Pack Saving
                      </span>
                      <div className="font-display text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(
                          report.economicSavingsInsight.savingsPerPack,
                        )}{" "}
                        ({report.economicSavingsInsight.savingsPercentage}% off)
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Annualized Savings
                      </span>
                      <div className="font-display text-base font-bold text-primary">
                        {formatMoney(
                          report.economicSavingsInsight.annualizedSavings,
                        )}{" "}
                        / year
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Counterfactuals ("What Would Change This?") */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Scale className="size-3.5 text-primary" />
                  Counterfactual Scenarios ("What Would Alter This Conclusion?")
                </h4>
                <div className="space-y-2">
                  {report.counterfactuals.map((cf, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-foreground"
                    >
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted font-bold text-[10px] text-muted-foreground">
                        {i + 1}
                      </span>
                      <span>{cf}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: REASONING CHAIN (Step-by-Step CoT) */}
            <TabsContent value="chain" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Traceable step-by-step reasoning executed across the clinical
                pipeline:
              </p>
              <div className="space-y-3">
                {report.decisionChain.map((step) => {
                  const isExpanded = expandedStep === step.step;
                  return (
                    <div
                      key={step.step}
                      className={cn(
                        "rounded-2xl border-2 transition-all",
                        isExpanded
                          ? "border-primary/50 bg-card shadow-sm"
                          : "border-border bg-card/60 hover:border-border/80",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedStep(isExpanded ? null : step.step)
                        }
                        className="flex w-full items-center justify-between p-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-7 place-items-center rounded-xl bg-primary/15 text-xs font-bold text-primary">
                            {step.step}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm font-bold text-ink">
                                {step.title}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-mono"
                              >
                                {step.agentName.split(" ")[0]}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {step.agentName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              step.riskLevel === "optimal" &&
                                "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                              step.riskLevel === "info" &&
                                "bg-blue-500/10 text-blue-600 border-blue-500/30",
                              step.riskLevel === "caution" &&
                                "bg-amber-500/10 text-amber-600 border-amber-500/30",
                              step.riskLevel === "warning" &&
                                "bg-rose-500/10 text-rose-600 border-rose-500/30",
                            )}
                          >
                            {step.confidence}% Confidence
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border/80 p-4 pt-3 space-y-3 bg-muted/10 rounded-b-2xl">
                          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                            {step.rationale}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                            <FileText className="size-3 text-primary" />
                            <strong>Regulatory Citation:</strong>
                            <span>{step.evidenceCitation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB 3: AGENT VOTES */}
            <TabsContent value="agents" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Consensus and confidence metrics reported by each specialized
                autonomous agent:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(report.agentVotes).map(([role, vote]) => (
                  <div
                    key={role}
                    className="rounded-2xl border-2 border-border bg-card p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold capitalize text-ink">
                        {role === "pharmacology" && "🔬 Pharmacology Agent"}
                        {role === "safety" && "🛡️ Safety & Toxicity Agent"}
                        {role === "economics" && "📈 Economics & Pricing Agent"}
                        {role === "triage" && "🩺 Clinical Triage Agent"}
                      </span>
                      <Badge
                        variant={vote.approved ? "default" : "destructive"}
                        className="text-[10px] font-bold uppercase"
                      >
                        {vote.approved ? "Approved" : "Flagged"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {vote.comment}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        Agent Confidence:
                      </span>
                      <span className="font-mono font-bold text-primary">
                        {vote.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 4: CLINICAL PHARMACOLOGY DEEP DIVE */}
            <TabsContent value="pharmacology" className="space-y-4 pt-4">
              <div className="rounded-2xl border-2 border-border bg-muted/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-ink font-bold text-sm">
                  <Microscope className="size-4 text-primary" />
                  Pharmacodynamics & Bioavailability Analysis
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-mono bg-card p-4 rounded-xl border border-border">
                  {report.clinicalPharmacologyNotes}
                </p>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                  <Info className="size-3.5 text-primary" />
                  Validated against CDSCO Indian Pharmacopoeia and WHO
                  Bioequivalence guidelines.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
