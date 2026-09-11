import { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Droplet,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Footprints,
  Heart,
  HeartPulse,
  Info,
  Layers,
  LineChart as LineChartIcon,
  Percent,
  Pill,
  Plus,
  Printer,
  RefreshCw,
  Scale,
  Search,
  Share2,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wind,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  DEMO_PATIENTS_VITALS,
  type PatientVitalsSummary,
  type VitalRecord,
} from "@/data/patient-vitals-data";
import { cn } from "@/lib/utils";

type MetricCategory =
  "all" | "cardiovascular" | "glycemic" | "weight" | "respiratory" | "renal";

interface PatientHealthMetricsDashboardProps {
  initialPatientId?: string;
  onSelectPatient?: (patientId: string) => void;
  standalone?: boolean;
}

export function PatientHealthMetricsDashboard({
  initialPatientId = "pt-1",
  onSelectPatient,
  standalone = true,
}: PatientHealthMetricsDashboardProps) {
  const [patients, setPatients] =
    useState<PatientVitalsSummary[]>(DEMO_PATIENTS_VITALS);
  const [selectedPatientId, setSelectedPatientId] =
    useState<string>(initialPatientId);
  const [activeCategory, setActiveCategory] = useState<MetricCategory>("all");
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d" | "90d">(
    "14d",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddVitalsOpen, setIsAddVitalsOpen] = useState(false);

  // New vitals form state
  const [newVitals, setNewVitals] = useState({
    systolic: "125",
    diastolic: "82",
    pulse: "72",
    fastingGlucose: "110",
    ppGlucose: "145",
    weight: "74.5",
    spo2: "98",
    clinicalNote: "",
  });

  // Current selected patient record
  const currentPatient = useMemo(() => {
    return (
      patients.find((p) => p.patientId === selectedPatientId) ?? patients[0]
    );
  }, [patients, selectedPatientId]);

  // Filtered patients for dropdown/search
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.primaryDiagnosis.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q),
    );
  }, [patients, searchQuery]);

  // Handle adding new vitals
  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const systolic = Number(newVitals.systolic) || 120;
    const diastolic = Number(newVitals.diastolic) || 80;
    const pulse = Number(newVitals.pulse) || 72;
    const fastingGlucose = Number(newVitals.fastingGlucose) || 100;
    const ppGlucose = Number(newVitals.ppGlucose) || 135;
    const weight =
      Number(newVitals.weight) ||
      currentPatient.summaryStats.weightAndBmi.currentWeight;
    const spo2 = Number(newVitals.spo2) || 98;
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    const newRecord: VitalRecord = {
      date: `${dateLabel} (New)`,
      timestamp: now.toISOString(),
      systolic,
      diastolic,
      pulse,
      fastingGlucose,
      ppGlucose,
      weight,
      bmi: Number((weight / 1.73 ** 2).toFixed(1)),
      spo2,
      egfr: currentPatient.summaryStats.renal.egfr,
      creatinine: currentPatient.summaryStats.renal.creatinine,
      steps: 8500,
      adherenceRate: 100,
      clinicalNote:
        newVitals.clinicalNote.trim() || "Recorded in OPD clinical session",
    };

    setPatients((prev) =>
      prev.map((p) => {
        if (p.patientId === currentPatient.patientId) {
          const updatedHistory = [...p.vitalsHistory, newRecord];
          return {
            ...p,
            lastUpdated: now.toISOString(),
            vitalsHistory: updatedHistory,
            summaryStats: {
              ...p.summaryStats,
              bloodPressure: {
                ...p.summaryStats.bloodPressure,
                latest: `${systolic}/${diastolic}`,
                meanSystolic: Math.round(
                  updatedHistory.reduce((acc, v) => acc + v.systolic, 0) /
                    updatedHistory.length,
                ),
                meanDiastolic: Math.round(
                  updatedHistory.reduce((acc, v) => acc + v.diastolic, 0) /
                    updatedHistory.length,
                ),
                status:
                  systolic < 120 && diastolic < 80
                    ? "Optimal"
                    : systolic <= 129 && diastolic < 80
                      ? "Normal"
                      : systolic <= 139 || diastolic <= 89
                        ? "Stage 1 HTN"
                        : "Stage 2 HTN",
              },
              glucose: {
                ...p.summaryStats.glucose,
                latestFasting: fastingGlucose,
                latestPP: ppGlucose,
              },
              weightAndBmi: {
                ...p.summaryStats.weightAndBmi,
                currentWeight: weight,
                currentBmi: Number((weight / 1.73 ** 2).toFixed(1)),
              },
              oxygenation: {
                ...p.summaryStats.oxygenation,
                spo2,
              },
            },
          };
        }
        return p;
      }),
    );

    setIsAddVitalsOpen(false);
    toast.success("Vitals entry successfully recorded", {
      description: `Logged BP ${systolic}/${diastolic} mmHg, Glucose ${fastingGlucose} mg/dL for ${currentPatient.patientName}.`,
    });
  };

  const handleExportTelemetry = () => {
    toast.success("Longitudinal Health Summary Exported", {
      description: `Generated clinical telemetry report PDF for ${currentPatient.patientName} (${currentPatient.uhid}).`,
    });
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Patient Selector & Header Bar */}
      <div className="surface rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Patient Profile Card */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <User className="size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold text-ink truncate">
                  {currentPatient.patientName}
                </h2>
                <Badge
                  variant="outline"
                  className="text-xs font-mono font-medium"
                >
                  {currentPatient.gender}, {currentPatient.age}y
                </Badge>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  {currentPatient.uhid}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xl">
                <span className="font-semibold text-foreground">
                  Diagnosis:
                </span>{" "}
                {currentPatient.primaryDiagnosis}
              </p>
            </div>
          </div>

          {/* Controls: Switch Patient, Time Filter, Add Vitals, Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Patient Switcher */}
            <Select
              value={selectedPatientId}
              onValueChange={(val) => {
                setSelectedPatientId(val);
                onSelectPatient?.(val);
              }}
            >
              <SelectTrigger className="w-[190px] h-9 text-xs font-medium rounded-xl border-border bg-background">
                <SelectValue placeholder="Select patient..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {patients.map((pt) => (
                  <SelectItem
                    key={pt.patientId}
                    value={pt.patientId}
                    className="text-xs"
                  >
                    <span className="font-bold">{pt.patientName}</span> (
                    {pt.age}y, {pt.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Window Filter */}
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 text-xs font-semibold">
              {(["7d", "14d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all",
                    timeRange === r
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Add Measurement Button */}
            <Button
              size="sm"
              onClick={() => setIsAddVitalsOpen(true)}
              className="h-9 gap-1.5 rounded-xl font-bold text-xs shadow-soft"
            >
              <Plus className="size-3.5" /> Log Vitals
            </Button>

            {/* Export Report */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportTelemetry}
              className="h-9 gap-1.5 rounded-xl font-bold text-xs"
            >
              <Download className="size-3.5" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Current Active Regimen & Allergy Ribbon */}
        <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-foreground flex items-center gap-1">
              <Pill className="size-3 text-primary" /> Active Regimen:
            </span>
            {currentPatient.currentMedications.map((med) => (
              <span
                key={med}
                className="rounded-md bg-secondary/80 px-2 py-0.5 font-medium text-foreground text-[11px]"
              >
                {med}
              </span>
            ))}
          </div>

          {currentPatient.allergies.length > 0 && (
            <div className="flex items-center gap-1.5 text-destructive font-semibold">
              <AlertTriangle className="size-3.5" />
              <span>Allergy: {currentPatient.allergies.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Domain Navigation Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/80 pb-2 text-xs font-semibold no-scrollbar">
        {[
          { id: "all", label: "All Health Metrics", icon: Layers },
          {
            id: "cardiovascular",
            label: "Cardiovascular (BP & Pulse)",
            icon: HeartPulse,
          },
          {
            id: "glycemic",
            label: "Glycemic (Glucose & HbA1c)",
            icon: Droplet,
          },
          {
            id: "weight",
            label: "Body Composition (Weight & BMI)",
            icon: Scale,
          },
          { id: "respiratory", label: "Respiratory (SpO2 & O2)", icon: Wind },
          { id: "renal", label: "Renal & Lipid Biomarkers", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as MetricCategory)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-2 whitespace-nowrap transition-all",
                isActive
                  ? "bg-primary text-primary-foreground font-bold shadow-soft"
                  : "bg-card border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Summary Statistics KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Blood Pressure */}
        <div className="surface rounded-2xl border border-border/80 bg-card p-4 shadow-soft space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Blood Pressure
            </span>
            <HeartPulse className="size-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-extrabold text-foreground">
              {currentPatient.summaryStats.bloodPressure.latest}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              mmHg
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold px-1.5 py-0 h-4 border-0",
                currentPatient.summaryStats.bloodPressure.statusTone ===
                  "positive"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
            >
              {currentPatient.summaryStats.bloodPressure.status}
            </Badge>
            <span className="text-muted-foreground font-mono text-[10px]">
              Avg: {currentPatient.summaryStats.bloodPressure.meanSystolic}/
              {currentPatient.summaryStats.bloodPressure.meanDiastolic}
            </span>
          </div>
        </div>

        {/* 2. Fasting & PP Glucose */}
        <div className="surface rounded-2xl border border-border/80 bg-card p-4 shadow-soft space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Fasting Glucose
            </span>
            <Droplet className="size-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-extrabold text-foreground">
              {currentPatient.summaryStats.glucose.latestFasting}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              mg/dL
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground text-[10px]">
              PP:{" "}
              <strong className="text-foreground">
                {currentPatient.summaryStats.glucose.latestPP}
              </strong>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
              TIR: {currentPatient.summaryStats.glucose.timeInRange}%
            </span>
          </div>
        </div>

        {/* 3. Estimated HbA1c */}
        <div className="surface rounded-2xl border border-border/80 bg-card p-4 shadow-soft space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Est. HbA1c
            </span>
            <Percent className="size-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-extrabold text-foreground">
              {currentPatient.summaryStats.glucose.estimatedHbA1c}%
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">
              In Target
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            ADA/RSSDI Target: &lt; 7.0%
          </div>
        </div>

        {/* 4. Resting Heart Rate */}
        <div className="surface rounded-2xl border border-border/80 bg-card p-4 shadow-soft space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Resting HR
            </span>
            <Heart className="size-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-extrabold text-foreground">
              {currentPatient.summaryStats.cardiac.restingHR}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              bpm
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>HRV: {currentPatient.summaryStats.cardiac.hrv} ms</span>
            <span className="text-emerald-600 font-bold">Sinus</span>
          </div>
        </div>

        {/* 5. Weight & BMI */}
        <div className="surface rounded-2xl border border-border/80 bg-card p-4 shadow-soft space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Weight & BMI
            </span>
            <Scale className="size-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-extrabold text-foreground">
              {currentPatient.summaryStats.weightAndBmi.currentWeight}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              kg
            </span>
            <span className="text-[11px] font-bold text-muted-foreground ml-1">
              ({currentPatient.summaryStats.weightAndBmi.currentBmi})
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-emerald-600 font-bold">
              {currentPatient.summaryStats.weightAndBmi.weightDelta90d} kg (90d)
            </span>
            <span className="text-muted-foreground">
              Goal: {currentPatient.summaryStats.weightAndBmi.targetWeight} kg
            </span>
          </div>
        </div>

        {/* 6. SpO2 Oxygenation */}
        <div className="surface rounded-2xl border border-border/80 bg-card p-4 shadow-soft space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Oxygen (SpO2)
            </span>
            <Wind className="size-4 text-teal-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-extrabold text-foreground">
              {currentPatient.summaryStats.oxygenation.spo2}%
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">
              Room Air
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Normal: 95% - 100%
          </div>
        </div>
      </div>

      {/* Main Longitudinal Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* CHART 1: Blood Pressure Dual Trend with Target Zones */}
        {(activeCategory === "all" || activeCategory === "cardiovascular") && (
          <div className="surface rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <HeartPulse className="size-4 text-rose-500" /> Blood Pressure
                  Trajectory (Systolic / Diastolic)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Longitudinal readings against ICMR/CSI clinical target bands
                  (&lt;130/80 mmHg).
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                  <span className="size-2.5 rounded-full bg-rose-500" />{" "}
                  Systolic
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                  <span className="size-2.5 rounded-full bg-teal-600" />{" "}
                  Diastolic
                </span>
              </div>
            </div>

            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentPatient.vitalsHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="sysGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#f43f5e"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="#f43f5e"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="diaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0d9488"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="#0d9488"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    domain={[60, 160]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    unit=" mmHg"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as VitalRecord;
                      return (
                        <div className="rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-3 shadow-soft text-xs space-y-1">
                          <p className="font-bold text-foreground">{label}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-rose-500 font-medium">
                              Systolic:
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {d.systolic} mmHg
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-teal-600 font-medium">
                              Diastolic:
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {d.diastolic} mmHg
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              Pulse:
                            </span>
                            <span className="font-mono text-foreground">
                              {d.pulse} bpm
                            </span>
                          </div>
                          {d.clinicalNote && (
                            <p className="mt-1 pt-1 border-t border-border/60 text-[11px] text-muted-foreground italic">
                              "{d.clinicalNote}"
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  {/* Hypertensive Crisis Threshold Line */}
                  <ReferenceLine
                    y={140}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{
                      value: "Stage 1 HTN (140)",
                      fill: "#ef4444",
                      fontSize: 10,
                    }}
                  />
                  {/* Normal Upper Threshold Line */}
                  <ReferenceLine
                    y={120}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: "Normal (120)",
                      fill: "#10b981",
                      fontSize: 10,
                    }}
                  />
                  <ReferenceLine
                    y={80}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: "Normal Dia (80)",
                      fill: "#10b981",
                      fontSize: 10,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="systolic"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#sysGradient)"
                    name="Systolic"
                  />
                  <Area
                    type="monotone"
                    dataKey="diastolic"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#diaGradient)"
                    name="Diastolic"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: Glycemic Control: Fasting vs Post-Prandial Blood Sugar */}
        {(activeCategory === "all" || activeCategory === "glycemic") && (
          <div className="surface rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <Droplet className="size-4 text-amber-500" /> Glycemic Control
                  (Fasting vs Post-Prandial)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daily glucose telemetry with RSSDI Target Green Band (70 - 140
                  mg/dL).
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                  <span className="size-2.5 rounded-full bg-amber-500" />{" "}
                  Fasting
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                  <span className="size-2.5 rounded-full bg-purple-600" />{" "}
                  Post-Prandial
                </span>
              </div>
            </div>

            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={currentPatient.vitalsHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    domain={[70, 200]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    unit=" mg/dL"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as VitalRecord;
                      return (
                        <div className="rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-3 shadow-soft text-xs space-y-1">
                          <p className="font-bold text-foreground">{label}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-amber-500 font-medium">
                              Fasting Glucose:
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {d.fastingGlucose} mg/dL
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-purple-600 font-medium">
                              Post-Prandial (PP):
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {d.ppGlucose} mg/dL
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Estimated daily average:{" "}
                            {Math.round((d.fastingGlucose + d.ppGlucose) / 2)}{" "}
                            mg/dL
                          </p>
                        </div>
                      );
                    }}
                  />
                  {/* Green Target Zone */}
                  <ReferenceArea
                    y1={70}
                    y2={140}
                    fill="#10b981"
                    fillOpacity={0.08}
                  />
                  <ReferenceLine
                    y={140}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: "Target PP (<140)",
                      fill: "#10b981",
                      fontSize: 10,
                    }}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: "Target Fasting (<100)",
                      fill: "#10b981",
                      fontSize: 10,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="fastingGlucose"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#f59e0b" }}
                    activeDot={{ r: 6 }}
                    name="Fasting"
                  />
                  <Line
                    type="monotone"
                    dataKey="ppGlucose"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8b5cf6" }}
                    activeDot={{ r: 6 }}
                    name="Post-Prandial"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: Weight & BMI Trajectory */}
        {(activeCategory === "all" || activeCategory === "weight") && (
          <div className="surface rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <Scale className="size-4 text-sky-500" /> Longitudinal Body
                  Weight & BMI Curve
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gradual caloric reduction and lifestyle management tracking.
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-mono font-bold text-emerald-600"
              >
                Goal: {currentPatient.summaryStats.weightAndBmi.targetWeight} kg
              </Badge>
            </div>

            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentPatient.vitalsHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="weightGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0284c7"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="#0284c7"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    domain={["dataMin - 2", "dataMax + 2"]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    unit=" kg"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as VitalRecord;
                      return (
                        <div className="rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-3 shadow-soft text-xs space-y-1">
                          <p className="font-bold text-foreground">{label}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sky-600 font-medium">
                              Weight:
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {d.weight} kg
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">BMI:</span>
                            <span className="font-mono font-bold text-foreground">
                              {d.bmi} kg/m²
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              Daily Activity:
                            </span>
                            <span className="font-mono text-foreground">
                              {d.steps.toLocaleString()} steps
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine
                    y={currentPatient.summaryStats.weightAndBmi.targetWeight}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Goal (${currentPatient.summaryStats.weightAndBmi.targetWeight} kg)`,
                      fill: "#10b981",
                      fontSize: 10,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#weightGradient)"
                    name="Weight (kg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 4: Cardiorespiratory Sync (Heart Rate vs SpO2) */}
        {(activeCategory === "all" || activeCategory === "respiratory") && (
          <div className="surface rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <Wind className="size-4 text-teal-500" /> Cardiorespiratory
                  Telemetry (Pulse & SpO2)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Oxygen saturation (%) and resting pulse rate (bpm) alignment.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                  <span className="size-2.5 rounded-full bg-teal-500" /> Pulse
                  (bpm)
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                  <span className="size-2.5 rounded-full bg-sky-500" /> SpO2 (%)
                </span>
              </div>
            </div>

            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={currentPatient.vitalsHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[50, 110]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    unit=" bpm"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[90, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as VitalRecord;
                      return (
                        <div className="rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-3 shadow-soft text-xs space-y-1">
                          <p className="font-bold text-foreground">{label}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-teal-600 font-medium">
                              Pulse:
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {d.pulse} bpm
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sky-600 font-medium">
                              SpO2:
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {d.spo2}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              Med Adherence:
                            </span>
                            <span className="font-mono text-emerald-600 font-bold">
                              {d.adherenceRate}%
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="pulse"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                    name="Pulse (bpm)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="spo2"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0284c7" }}
                    name="SpO2 (%)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Lipid Biomarkers Breakdown & Clinical Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lipid Profile Panel (2 Cols) */}
        <div className="lg:col-span-2 surface rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="size-4 text-primary" /> Lipid Profile &
                Atherogenic Risk Stratification
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current lipid fractions against standard Indian cardiometabolic
                reference cutoffs.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold">
              Fast Track Panel
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {currentPatient.lipidProfile.map((lip) => {
              const isOver =
                lip.value > lip.target && lip.metric !== "HDL Cholesterol";
              const isGood = lip.status === "Optimal";
              return (
                <div
                  key={lip.metric}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">
                      {lip.metric}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0 h-4 border-0",
                        isGood
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {lip.status}
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-lg font-black text-foreground">
                      {lip.value}{" "}
                      <span className="text-[10px] font-mono text-muted-foreground font-normal">
                        {lip.unit}
                      </span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Target: &lt; {lip.target} {lip.unit}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isGood ? "bg-emerald-500" : "bg-amber-500",
                      )}
                      style={{
                        width: `${Math.min(100, (lip.value / (lip.target * 1.3)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Alerts & Recommendations (1 Col) */}
        <div className="surface rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
          <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="size-4 text-primary" /> Active Clinical
            Action Flags
          </h3>

          {currentPatient.clinicalAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-2">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <p className="text-xs font-semibold text-foreground">
                All parameters within acceptable threshold
              </p>
              <p className="text-[11px]">
                No urgent clinical flags requiring immediate clinician
                intervention.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentPatient.clinicalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <AlertTriangle
                        className={cn(
                          "size-3.5",
                          alert.severity === "high"
                            ? "text-destructive"
                            : "text-amber-500",
                        )}
                      />
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {alert.date}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {alert.detail}
                  </p>
                  <div className="pt-1 text-[11px] font-medium text-primary">
                    <span className="font-bold">Recommendation:</span>{" "}
                    {alert.suggestedAction}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Doctor Decision Box */}
          <div className="rounded-2xl bg-secondary/60 p-3.5 border border-border/60 text-xs space-y-2">
            <span className="font-bold text-foreground block">
              Treating Clinician Protocol:
            </span>
            <p className="text-muted-foreground text-[11px]">
              Assigned: {currentPatient.treatingDoctor}. Scheduled for quarterly
              routine follow-up.
            </p>
          </div>
        </div>
      </div>

      {/* Log Vitals Modal Dialog */}
      <Dialog open={isAddVitalsOpen} onOpenChange={setIsAddVitalsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display flex items-center gap-2">
              <HeartPulse className="size-5 text-primary" /> Record Patient
              Vitals
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter updated clinical measurements for{" "}
              <strong>{currentPatient.patientName}</strong> (
              {currentPatient.uhid}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVitals} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sys" className="text-xs font-bold">
                  Systolic BP (mmHg)
                </Label>
                <Input
                  id="sys"
                  type="number"
                  placeholder="120"
                  value={newVitals.systolic}
                  onChange={(e) =>
                    setNewVitals({ ...newVitals, systolic: e.target.value })
                  }
                  className="h-9 rounded-xl font-mono text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dia" className="text-xs font-bold">
                  Diastolic BP (mmHg)
                </Label>
                <Input
                  id="dia"
                  type="number"
                  placeholder="80"
                  value={newVitals.diastolic}
                  onChange={(e) =>
                    setNewVitals({ ...newVitals, diastolic: e.target.value })
                  }
                  className="h-9 rounded-xl font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fasting" className="text-xs font-bold">
                  Fasting Glucose (mg/dL)
                </Label>
                <Input
                  id="fasting"
                  type="number"
                  placeholder="100"
                  value={newVitals.fastingGlucose}
                  onChange={(e) =>
                    setNewVitals({
                      ...newVitals,
                      fastingGlucose: e.target.value,
                    })
                  }
                  className="h-9 rounded-xl font-mono text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pp" className="text-xs font-bold">
                  PP Glucose (mg/dL)
                </Label>
                <Input
                  id="pp"
                  type="number"
                  placeholder="140"
                  value={newVitals.ppGlucose}
                  onChange={(e) =>
                    setNewVitals({ ...newVitals, ppGlucose: e.target.value })
                  }
                  className="h-9 rounded-xl font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pulse" className="text-xs font-bold">
                  Pulse (bpm)
                </Label>
                <Input
                  id="pulse"
                  type="number"
                  placeholder="72"
                  value={newVitals.pulse}
                  onChange={(e) =>
                    setNewVitals({ ...newVitals, pulse: e.target.value })
                  }
                  className="h-9 rounded-xl font-mono text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight" className="text-xs font-bold">
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="74.0"
                  value={newVitals.weight}
                  onChange={(e) =>
                    setNewVitals({ ...newVitals, weight: e.target.value })
                  }
                  className="h-9 rounded-xl font-mono text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spo2" className="text-xs font-bold">
                  SpO2 (%)
                </Label>
                <Input
                  id="spo2"
                  type="number"
                  placeholder="98"
                  value={newVitals.spo2}
                  onChange={(e) =>
                    setNewVitals({ ...newVitals, spo2: e.target.value })
                  }
                  className="h-9 rounded-xl font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinicalNote" className="text-xs font-bold">
                Clinical Observation / Note
              </Label>
              <Input
                id="clinicalNote"
                placeholder="e.g. Dose adherence verified, diet controlled"
                value={newVitals.clinicalNote}
                onChange={(e) =>
                  setNewVitals({ ...newVitals, clinicalNote: e.target.value })
                }
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddVitalsOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold shadow-soft"
              >
                Save Measurement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
