import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatTile } from "@/components/common/primitives";
import { ChartFrame, TrendAreaChart } from "@/components/workspace/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/analytics")({
  head: () => ({
    meta: [
      { title: "Practice Analytics — Clinician Workspace | Medora" },
      {
        name: "description",
        content:
          "Clinical practice volume telemetry, follow-up adherence rates, generic prescribing ratios, and disease burden trends.",
      },
    ],
  }),
  component: DoctorAnalyticsPage,
});

const PATIENT_VOLUME_SERIES = [
  { date: "10 Aug", value: 38 },
  { date: "11 Aug", value: 44 },
  { date: "12 Aug", value: 49 },
  { date: "13 Aug", value: 42 },
  { date: "14 Aug", value: 53 },
  { date: "15 Aug", value: 30 },
  { date: "16 Aug", value: 58 },
  { date: "17 Aug", value: 62 },
  { date: "18 Aug", value: 56 },
  { date: "19 Aug", value: 64 },
  { date: "20 Aug", value: 71 },
  { date: "21 Aug", value: 68 },
  { date: "22 Aug", value: 75 },
  { date: "23 Aug", value: 78 },
];

const TOP_CONDITIONS = [
  { name: "Type 2 Diabetes Mellitus", count: 398, share: 32, trend: "+4%" },
  { name: "Essential Hypertension", count: 348, share: 28, trend: "+2%" },
  {
    name: "Upper Respiratory Infections (URTI)",
    count: 198,
    share: 16,
    trend: "+12%",
  },
  {
    name: "Dyslipidemia & Hypercholesterolemia",
    count: 174,
    share: 14,
    trend: "-1%",
  },
  { name: "Hypothyroidism & Endocrine", count: 124, share: 10, trend: "+3%" },
];

const TOP_DRUGS_PRESCRIBED = [
  {
    name: "Metformin Hydrochloride 500mg SR",
    category: "Antidiabetic",
    count: 312,
    genericRate: "100%",
  },
  {
    name: "Telmisartan 40mg",
    category: "Antihypertensive",
    count: 284,
    genericRate: "98%",
  },
  {
    name: "Atorvastatin 20mg",
    category: "Lipid Lowering",
    count: 242,
    genericRate: "96%",
  },
  {
    name: "Paracetamol 650mg",
    category: "Analgesic / Antipyretic",
    count: 198,
    genericRate: "100%",
  },
  {
    name: "Amoxicillin + Clavulanic Acid 625mg",
    category: "Antibiotic (AWaRe)",
    count: 86,
    genericRate: "94%",
  },
];

function DoctorAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"14d" | "30d" | "90d">("14d");

  const handleExportReport = () => {
    toast.success("Clinical Quality Audit Exported", {
      description: "Downloaded monthly practice telemetry as PDF report.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Practice Analytics & Quality Metrics"
          description="Track patient footfall trends, diagnostic disease distribution, generic drug prescribing compliance, and clinical outcome indices."
        />
        <Button
          size="sm"
          variant="outline"
          className="h-9 font-bold text-xs gap-1.5 self-start sm:self-auto rounded-xl"
          onClick={handleExportReport}
        >
          <Download className="size-3.5" /> Export Monthly Report
        </Button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Monthly OPD Footfall"
          value="1,248"
          hint="+14.2% vs last month"
          icon={Users}
          tone="default"
        />
        <StatTile
          label="Follow-up Adherence"
          value="89.4%"
          hint="Target: > 85%"
          icon={CheckCircle2}
          tone="positive"
        />
        <StatTile
          label="Generic Rx Adoption"
          value="92.8%"
          hint="Indian NLEM aligned"
          icon={Pill}
          tone="positive"
        />
        <StatTile
          label="Avg Consult Duration"
          value="13.8 min"
          hint="Optimal clinical engagement"
          icon={Clock}
          tone="default"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Volume Trend (2 Cols) */}
        <div className="lg:col-span-2">
          <ChartFrame
            title="Daily OPD Patient Footfall Trend"
            description="14-day rolling clinical consultations and follow-up reviews."
          >
            <TrendAreaChart
              data={PATIENT_VOLUME_SERIES}
              xKey="date"
              yKey="value"
              label="Patients"
            />
          </ChartFrame>
        </div>

        {/* Quality & Stewardship Scores (1 Col) */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-5">
          <h3 className="font-display font-extrabold text-sm text-foreground flex items-center gap-2">
            <Award className="size-4 text-primary" /> Clinical Quality
            Accreditations
          </h3>

          <div className="space-y-4 text-xs">
            <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  ICMR Antibiotic Stewardship
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  96.2%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: "96.2%" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Rational antibiotic use without over-prescribing.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  Patient Recovery Index
                </span>
                <span className="font-black text-primary">94.8%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "94.8%" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Symptom resolution within standard therapeutic window.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  Digital Rx Delivery Rate
                </span>
                <span className="font-black text-sky-600">99.1%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: "99.1%" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Zero prescription loss via automated SMS/App sync.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disease Distribution & Top Prescribed Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disease Prevalence */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h3 className="font-display font-extrabold text-sm text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HeartPulse className="size-4 text-primary" /> Top Diagnosed
              Clinical Conditions
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              This Month
            </span>
          </h3>

          <div className="space-y-3">
            {TOP_CONDITIONS.map((c) => (
              <div key={c.name} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{c.name}</span>
                  <span className="font-medium text-muted-foreground">
                    {c.count} cases ({c.share}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary/80 rounded-full"
                    style={{ width: `${c.share * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Prescribed Molecules */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h3 className="font-display font-extrabold text-sm text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Pill className="size-4 text-primary" /> Top Prescribed
              Therapeutics
            </span>
            <Badge variant="outline" className="text-[10px] font-bold">
              NLEM 2024
            </Badge>
          </h3>

          <div className="divide-y divide-border/60">
            {TOP_DRUGS_PRESCRIBED.map((d) => (
              <div
                key={d.name}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-foreground">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.category}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">
                    {d.count} Rxs
                  </span>
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    {d.genericRate} generic
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
