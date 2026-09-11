import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  FlaskConical,
  HeartPulse,
  Info,
  Microscope,
  PhoneCall,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatTile } from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/labs")({
  head: () => ({
    meta: [
      { title: "Lab & Diagnostics — Clinician Workspace | Medora" },
      {
        name: "description",
        content:
          "Review patient diagnostic test reports, critical abnormal biomarker alerts, glycemic trends, and renal panels.",
      },
    ],
  }),
  component: DoctorLabsPage,
});

interface LabReportItem {
  id: string;
  patientId: string;
  patientName: string;
  patientAgeGender: string;
  testName: string;
  category:
    | "Glycemic"
    | "Renal (KFT)"
    | "Hematology"
    | "Lipid"
    | "Hepatic (LFT)"
    | "Thyroid";
  labName: string;
  collectedAt: string;
  status: "critical" | "abnormal" | "normal";
  primaryResult: string;
  unit: string;
  referenceRange: string;
  doctorInterpretation: string;
  suggestedAction: string;
  previousValue?: string;
}

const DEMO_LAB_REPORTS: LabReportItem[] = [
  {
    id: "LAB-9021",
    patientId: "P-101",
    patientName: "Rajesh Sharma",
    patientAgeGender: "58y / Male",
    testName: "Glycated Hemoglobin (HbA1c)",
    category: "Glycemic",
    labName: "Dr. Lal PathLabs — Indiranagar",
    collectedAt: "23 Aug 2026, 08:30 AM",
    status: "critical",
    primaryResult: "9.2",
    unit: "%",
    referenceRange: "4.0 - 5.6 % (Normal) | > 6.5 % (Diabetic)",
    previousValue: "7.8 % (3 mos ago)",
    doctorInterpretation:
      "Severely uncontrolled hyperglycemia. Elevated risk of microvascular complications.",
    suggestedAction:
      "Up-titrate Metformin or initiate basal insulin glargine. Schedule urgent dietetic review.",
  },
  {
    id: "LAB-9022",
    patientId: "P-104",
    patientName: "Meera Venkatesh",
    patientAgeGender: "64y / Female",
    testName: "Serum Creatinine & eGFR",
    category: "Renal (KFT)",
    labName: "Metropolis Healthcare — Koramangala",
    collectedAt: "23 Aug 2026, 09:15 AM",
    status: "critical",
    primaryResult: "2.4",
    unit: "mg/dL",
    referenceRange: "0.6 - 1.1 mg/dL (eGFR: 28 mL/min/1.73m²)",
    previousValue: "1.4 mg/dL (6 mos ago)",
    doctorInterpretation:
      "Acute-on-chronic renal decline (CKD Stage 4). Metformin & NSAIDs strictly contraindicated.",
    suggestedAction:
      "Adjust renal-cleared drug doses immediately. Hold SGLT2 inhibitors and nephrotoxic analgesics.",
  },
  {
    id: "LAB-9023",
    patientId: "P-102",
    patientName: "Sunita Patel",
    patientAgeGender: "45y / Female",
    testName: "Lipid Profile — LDL Cholesterol",
    category: "Lipid",
    labName: "Apollo Diagnostics — Jayanagar",
    collectedAt: "22 Aug 2026, 07:45 AM",
    status: "abnormal",
    primaryResult: "168",
    unit: "mg/dL",
    referenceRange: "< 100 mg/dL (Optimal)",
    previousValue: "182 mg/dL",
    doctorInterpretation:
      "Primary dyslipidemia improving on Atorvastatin 20mg, still above target (< 70 mg/dL for high risk).",
    suggestedAction:
      "Step up Atorvastatin to 40 mg daily or add Ezetimibe 10 mg. Recheck in 8 weeks.",
  },
  {
    id: "LAB-9024",
    patientId: "P-105",
    patientName: "Vikram Malhotra",
    patientAgeGender: "38y / Male",
    testName: "Complete Blood Count (Platelet Count)",
    category: "Hematology",
    labName: "Thyrocare Technologies — HSR",
    collectedAt: "23 Aug 2026, 11:00 AM",
    status: "critical",
    primaryResult: "72,000",
    unit: "/µL",
    referenceRange: "150,000 - 450,000 /µL",
    previousValue: "210,000 /µL",
    doctorInterpretation:
      "Moderate acute thrombocytopenia. Rule out viral etiology (Dengue NS1/IgM) or drug-induced etiology.",
    suggestedAction:
      "Repeat platelet count in 24 hrs. Advise patient on warning signs of spontaneous bleeding.",
  },
  {
    id: "LAB-9025",
    patientId: "P-103",
    patientName: "Amitabh Sen",
    patientAgeGender: "52y / Male",
    testName: "Liver Function Test — SGPT (ALT)",
    category: "Hepatic (LFT)",
    labName: "Dr. Lal PathLabs — Whitefield",
    collectedAt: "21 Aug 2026, 10:20 AM",
    status: "abnormal",
    primaryResult: "78",
    unit: "U/L",
    referenceRange: "7 - 56 U/L",
    previousValue: "42 U/L",
    doctorInterpretation:
      "Mild transaminitis consistent with non-alcoholic fatty liver disease (NAFLD) or statin-related enzyme rise.",
    suggestedAction:
      "Maintain lipid therapy. Recommend lifestyle weight management and alcohol avoidance.",
  },
  {
    id: "LAB-9026",
    patientId: "P-106",
    patientName: "Ananya Iyer",
    patientAgeGender: "29y / Female",
    testName: "Thyroid Stimulating Hormone (TSH)",
    category: "Thyroid",
    labName: "Neuberg Anand Reference Lab",
    collectedAt: "20 Aug 2026, 08:00 AM",
    status: "normal",
    primaryResult: "2.8",
    unit: "mIU/L",
    referenceRange: "0.4 - 4.2 mIU/L (Euthyroid)",
    previousValue: "6.4 mIU/L",
    doctorInterpretation:
      "Well-controlled on current Levothyroxine 50 mcg regimen. Stable euthyroid state achieved.",
    suggestedAction:
      "Continue Levothyroxine 50 mcg once daily before breakfast. Annual TSH surveillance.",
  },
];

function DoctorLabsPage() {
  const [reports, setReports] = useState<LabReportItem[]>(DEMO_LAB_REPORTS);
  const [selectedReport, setSelectedReport] = useState<LabReportItem | null>(
    null,
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter)
        return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.patientName.toLowerCase().includes(q) ||
          r.testName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.labName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [reports, categoryFilter, statusFilter, searchQuery]);

  const criticalCount = reports.filter((r) => r.status === "critical").length;
  const abnormalCount = reports.filter((r) => r.status === "abnormal").length;
  const normalCount = reports.filter((r) => r.status === "normal").length;

  const handleNotifyPatient = (report: LabReportItem) => {
    toast.success(`Clinical Alert sent to ${report.patientName}`, {
      description: `SMS and Medora App Notification dispatched with advisory note.`,
    });
  };

  const handleOrderDosageAdjustment = (report: LabReportItem) => {
    toast.info(`Dosage Modification Queued for ${report.patientName}`, {
      description: `Recommendation added to clinical review queue.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic & Pathology Intelligence"
        description="Monitor abnormal biomarker alerts, evaluate patient lab results, and adjust prescriptions based on renal and glycemic panels."
        actions={
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary font-bold text-xs"
          >
            Pathology Stream Active
          </Badge>
        }
      />

      {/* Critical Biomarker Alert Strip */}
      {criticalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-destructive/40 bg-destructive-soft/70 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-destructive text-destructive-foreground">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-extrabold text-sm text-destructive">
                  {criticalCount} Critical Laboratory Alerts Requiring Immediate
                  Action
                </h4>
                <span className="animate-pulse rounded-full bg-destructive size-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Urgent biomarker deviations detected in HbA1c, Serum Creatinine,
                and Platelets. Review and adjust medication regimens.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setStatusFilter("critical");
              toast.info("Filtered view for Critical Alerts");
            }}
            className="font-bold text-xs h-8 shrink-0"
          >
            Review Critical Only ({criticalCount})
          </Button>
        </div>
      )}

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Total Lab Tests"
          value={String(reports.length)}
          hint="Last 48 hours"
          icon={FlaskConical}
          tone="default"
        />
        <StatTile
          label="Critical Out-of-Range"
          value={String(criticalCount)}
          hint="Immediate doctor review"
          icon={AlertCircle}
          tone="attention"
        />
        <StatTile
          label="Abnormal Biomarkers"
          value={String(abnormalCount)}
          hint="Medication tuning needed"
          icon={AlertTriangle}
          tone="attention"
        />
        <StatTile
          label="Within Normal Limits"
          value={String(normalCount)}
          hint="Stable therapeutic range"
          icon={CheckCircle2}
          tone="positive"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, test name, or report ID…"
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Panels</SelectItem>
              <SelectItem value="Glycemic">Glycemic / HbA1c</SelectItem>
              <SelectItem value="Renal (KFT)">Renal (KFT)</SelectItem>
              <SelectItem value="Hematology">Hematology (CBC)</SelectItem>
              <SelectItem value="Lipid">Lipid Profile</SelectItem>
              <SelectItem value="Hepatic (LFT)">Hepatic (LFT)</SelectItem>
              <SelectItem value="Thyroid">Thyroid (TFT)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="critical">🔴 Critical</SelectItem>
              <SelectItem value="abnormal">🟡 Abnormal</SelectItem>
              <SelectItem value="normal">🟢 Normal</SelectItem>
            </SelectContent>
          </Select>

          {(categoryFilter !== "all" ||
            statusFilter !== "all" ||
            searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="h-9 text-xs font-semibold"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => {
          const isCritical = report.status === "critical";
          const isAbnormal = report.status === "abnormal";

          return (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={cn(
                "group cursor-pointer rounded-2xl border p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between bg-card",
                isCritical &&
                  "border-destructive/40 bg-gradient-to-br from-destructive/5 via-card to-card hover:border-destructive/60",
                isAbnormal &&
                  "border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card hover:border-amber-500/60",
                !isCritical &&
                  !isAbnormal &&
                  "border-border hover:border-primary/40",
              )}
            >
              <div className="space-y-3">
                {/* Header: ID, Date, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      {report.id} · {report.category}
                    </span>
                    <h3 className="font-display font-bold text-sm text-foreground mt-0.5 group-hover:text-primary transition-colors">
                      {report.testName}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                      isCritical &&
                        "border-destructive/40 bg-destructive/10 text-destructive",
                      isAbnormal &&
                        "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                      !isCritical &&
                        !isAbnormal &&
                        "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    )}
                  >
                    {isCritical
                      ? "Critical High"
                      : isAbnormal
                        ? "Abnormal"
                        : "Normal"}
                  </Badge>
                </div>

                {/* Patient Info */}
                <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-2 text-xs">
                  <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    {report.patientName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {report.patientName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {report.patientAgeGender}
                    </p>
                  </div>
                </div>

                {/* Main Result Number */}
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Observed Value
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span
                          className={cn(
                            "text-2xl font-black font-display",
                            isCritical && "text-destructive",
                            isAbnormal && "text-amber-600 dark:text-amber-400",
                            !isCritical &&
                              !isAbnormal &&
                              "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          {report.primaryResult}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">
                          {report.unit}
                        </span>
                      </div>
                    </div>
                    {report.previousValue && (
                      <div className="text-right">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Previous
                        </span>
                        <p className="text-xs font-semibold text-foreground mt-0.5">
                          {report.previousValue}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground border-t border-border/40 pt-1.5">
                    <span className="font-medium text-foreground">Ref:</span>{" "}
                    {report.referenceRange}
                  </p>
                </div>

                {/* Clinician Note */}
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{report.doctorInterpretation}"
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />{" "}
                  {report.collectedAt.split(",")[0]}
                </span>
                <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Detail & Actions &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Detail Modal */}
      <Dialog
        open={Boolean(selectedReport)}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        {selectedReport && (
          <DialogContent className="max-w-xl rounded-3xl p-6">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-primary uppercase">
                  {selectedReport.id} · {selectedReport.category}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-bold px-2.5 py-0.5 rounded-full",
                    selectedReport.status === "critical" &&
                      "border-destructive/40 bg-destructive/10 text-destructive",
                    selectedReport.status === "abnormal" &&
                      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                    selectedReport.status === "normal" &&
                      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  {selectedReport.status.toUpperCase()}
                </Badge>
              </div>
              <DialogTitle className="font-display text-lg font-extrabold text-foreground mt-1">
                {selectedReport.testName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Conducted at {selectedReport.labName} on{" "}
                {selectedReport.collectedAt}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Patient Badge */}
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                    {selectedReport.patientName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">
                      {selectedReport.patientName}
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      {selectedReport.patientAgeGender} · ID:{" "}
                      {selectedReport.patientId}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-semibold"
                  onClick={() => handleNotifyPatient(selectedReport)}
                >
                  <PhoneCall className="size-3.5" /> Call Patient
                </Button>
              </div>

              {/* Result Comparison Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    Current Observed Result
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span
                      className={cn(
                        "text-3xl font-black font-display",
                        selectedReport.status === "critical" &&
                          "text-destructive",
                        selectedReport.status === "abnormal" &&
                          "text-amber-600",
                        selectedReport.status === "normal" &&
                          "text-emerald-600",
                      )}
                    >
                      {selectedReport.primaryResult}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {selectedReport.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    <span className="font-medium text-foreground">
                      Standard Range:
                    </span>{" "}
                    {selectedReport.referenceRange}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    Historical Comparison
                  </span>
                  <p className="text-sm font-bold text-foreground mt-2">
                    {selectedReport.previousValue ||
                      "First recorded test in Medora"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                    <Sparkles className="size-3.5 text-primary" />
                    AI Clinical Delta calculated
                  </p>
                </div>
              </div>

              {/* Clinical AI Interpretation & Suggested Rx Action */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h4 className="font-display font-bold text-xs text-primary uppercase tracking-wider">
                    Clinical Decision Recommendation
                  </h4>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  <strong className="text-foreground">Interpretation:</strong>{" "}
                  {selectedReport.doctorInterpretation}
                </p>
                <p className="text-xs text-primary font-medium leading-relaxed bg-card/60 p-2.5 rounded-xl border border-primary/15">
                  <strong className="text-primary font-bold">
                    Suggested Action:
                  </strong>{" "}
                  {selectedReport.suggestedAction}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs font-bold"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs font-bold gap-1.5"
                  onClick={() => handleNotifyPatient(selectedReport)}
                >
                  <Send className="size-3.5 text-primary" />
                  Notify Patient
                </Button>
                <Button
                  size="sm"
                  className="h-9 text-xs font-bold gap-1.5"
                  onClick={() => {
                    handleOrderDosageAdjustment(selectedReport);
                    setSelectedReport(null);
                  }}
                >
                  <Zap className="size-3.5" />
                  Adjust Prescription
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
