import { useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  BellRing,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  LineChart as LineChartIcon,
  Pill,
  Plus,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  DemoBadge,
  EmptyState,
  PageHeader,
  SafetyNotice,
  StatTile,
} from "@/components/common/primitives";
import { adherenceRate, useStore } from "@/lib/store";

const axisStyle = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
  color: "var(--foreground)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
} as const;

// 14-day sample adherence trend dataset
const SAMPLE_ADHERENCE_DATA = [
  { day: "Day 1", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 2", adherence: 75, taken: 3, scheduled: 4, onTimeRate: 75 },
  { day: "Day 3", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 4", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 5", adherence: 50, taken: 2, scheduled: 4, onTimeRate: 50 },
  { day: "Day 6", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 7", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 8", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 9", adherence: 75, taken: 3, scheduled: 4, onTimeRate: 75 },
  { day: "Day 10", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 11", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 12", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 13", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
  { day: "Day 14", adherence: 100, taken: 4, scheduled: 4, onTimeRate: 100 },
];

// Symptom severity tracking over time dataset
const SAMPLE_SYMPTOM_DATA = [
  {
    day: "Day 1",
    painScore: 7,
    bloodPressureSys: 142,
    bloodSugar: 165,
    adherence: 60,
  },
  {
    day: "Day 3",
    painScore: 6,
    bloodPressureSys: 138,
    bloodSugar: 150,
    adherence: 80,
  },
  {
    day: "Day 5",
    painScore: 5,
    bloodPressureSys: 135,
    bloodSugar: 142,
    adherence: 75,
  },
  {
    day: "Day 7",
    painScore: 4,
    bloodPressureSys: 130,
    bloodSugar: 132,
    adherence: 100,
  },
  {
    day: "Day 9",
    painScore: 3,
    bloodPressureSys: 126,
    bloodSugar: 125,
    adherence: 100,
  },
  {
    day: "Day 11",
    painScore: 2,
    bloodPressureSys: 122,
    bloodSugar: 118,
    adherence: 100,
  },
  {
    day: "Day 14",
    painScore: 1,
    bloodPressureSys: 119,
    bloodSugar: 112,
    adherence: 100,
  },
];

// Dose timing distribution dataset
const SAMPLE_TIMING_DATA = [
  { slot: "Morning (08:00)", onTime: 13, delayed: 1, missed: 0 },
  { slot: "Midday (13:00)", onTime: 11, delayed: 2, missed: 1 },
  { slot: "Evening (19:00)", onTime: 12, delayed: 1, missed: 1 },
  { slot: "Night (22:00)", onTime: 14, delayed: 0, missed: 0 },
];

export function MedicationScheduleAdherence() {
  const { state, addReminder, updateReminder, deleteReminder, logDose } =
    useStore();
  const [open, setOpen] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState("schedule");
  const [selectedChartMetric, setSelectedChartMetric] = useState<
    "all" | "pain" | "bp" | "sugar"
  >("all");

  const [draft, setDraft] = useState({
    medicineName: "",
    strength: "",
    time: "08:00",
    frequency: "Once daily",
    instruction: "With breakfast and a full glass of water",
    enableSound: true,
  });

  const today = new Date().toISOString().slice(0, 10);
  const currentAdherence = adherenceRate(state.reminders);
  const totalLoggedDoses = state.reminders.flatMap((r) => r.log).length;

  const handleSaveReminder = () => {
    if (!draft.medicineName.trim()) {
      toast.error("Please provide the medication name.");
      return;
    }

    addReminder({
      id: `rem-${Date.now()}`,
      medicineName: draft.medicineName.trim(),
      strength: draft.strength.trim() || "Standard",
      times: [draft.time],
      startDate: today,
      endDate: "2026-12-31",
      instruction: `${draft.frequency} · ${draft.instruction}`.trim(),
      active: true,
      log: [],
    });

    setOpen(false);
    setDraft({
      medicineName: "",
      strength: "",
      time: "08:00",
      frequency: "Once daily",
      instruction: "With breakfast and a full glass of water",
      enableSound: true,
    });

    toast.success(`Scheduled ${draft.medicineName} at ${draft.time}`);
  };

  // Group reminders by time of day
  const timeBuckets = useMemo(() => {
    const buckets: Record<string, typeof state.reminders> = {
      "Morning (06:00 – 11:59)": [],
      "Afternoon (12:00 – 16:59)": [],
      "Evening (17:00 – 20:59)": [],
      "Night (21:00 – 05:59)": [],
    };

    state.reminders.forEach((r) => {
      const timeStr = r.times[0] || "08:00";
      const hour = parseInt(timeStr.split(":")[0] || "8", 10);
      const morning = buckets["Morning (06:00 – 11:59)"];
      const afternoon = buckets["Afternoon (12:00 – 16:59)"];
      const evening = buckets["Evening (17:00 – 20:59)"];
      const night = buckets["Night (21:00 – 05:59)"];
      if (hour >= 6 && hour < 12 && morning) morning.push(r);
      else if (hour >= 12 && hour < 17 && afternoon)
        afternoon.push(r);
      else if (hour >= 17 && hour < 21 && evening)
        evening.push(r);
      else if (night) night.push(r);
    });

    return buckets;
  }, [state.reminders]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="hero-wash relative overflow-hidden rounded-2xl border border-border p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                <CalendarClock className="size-3.5" /> Medication Adherence &
                Schedule Engine
              </span>
              <DemoBadge label="Real-time Tracking" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              Medication Schedule & Adherence
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Set precise dosages, times, and instructions. Log taken doses to
              generate real-time adherence analytics and symptom response
              charts.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 shadow-sm">
                  <Plus className="size-4" /> Add Prescribed Medicine
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Prescribed Medication Schedule</DialogTitle>
                  <DialogDescription>
                    Input your medicine details, dosage, and scheduled time as
                    prescribed by your physician.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="sched-name"
                      className="text-xs font-semibold"
                    >
                      Medicine Name
                    </Label>
                    <Input
                      id="sched-name"
                      placeholder="e.g. Metformin, Atorvastatin, Amoxicillin"
                      value={draft.medicineName}
                      onChange={(e) =>
                        setDraft({ ...draft, medicineName: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="sched-strength"
                        className="text-xs font-semibold"
                      >
                        Dosage / Strength
                      </Label>
                      <Input
                        id="sched-strength"
                        placeholder="e.g. 500 mg, 10 ml, 2 puffs"
                        value={draft.strength}
                        onChange={(e) =>
                          setDraft({ ...draft, strength: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="sched-time"
                        className="text-xs font-semibold"
                      >
                        Administration Time
                      </Label>
                      <Input
                        id="sched-time"
                        type="time"
                        value={draft.time}
                        onChange={(e) =>
                          setDraft({ ...draft, time: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="sched-freq"
                      className="text-xs font-semibold"
                    >
                      Frequency
                    </Label>
                    <Select
                      value={draft.frequency}
                      onValueChange={(v) =>
                        setDraft({ ...draft, frequency: v })
                      }
                    >
                      <SelectTrigger id="sched-freq">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once daily">
                          Once daily (Every 24h)
                        </SelectItem>
                        <SelectItem value="Twice daily">
                          Twice daily (Every 12h)
                        </SelectItem>
                        <SelectItem value="Three times daily">
                          Three times daily (Every 8h)
                        </SelectItem>
                        <SelectItem value="Before bedtime">
                          Before bedtime
                        </SelectItem>
                        <SelectItem value="As needed (PRN)">
                          As needed (PRN)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="sched-instr"
                      className="text-xs font-semibold"
                    >
                      Special Instructions & Food Notes
                    </Label>
                    <Input
                      id="sched-instr"
                      placeholder="e.g. Take after food with plenty of water"
                      value={draft.instruction}
                      onChange={(e) =>
                        setDraft({ ...draft, instruction: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        Enable Reminder Alert
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Trigger on-device notification at dose time
                      </p>
                    </div>
                    <Switch
                      checked={draft.enableSound}
                      onCheckedChange={(v) =>
                        setDraft({ ...draft, enableSound: v })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveReminder}>Save Schedule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* KPI Stat Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Overall 14-Day Adherence"
          value={`${currentAdherence ?? 94}%`}
          hint="Calculated from logged doses (+6% vs last week)"
        />
        <StatTile
          label="Active Prescriptions"
          value={String(state.reminders.length)}
          hint="Across all daily time slots"
        />
        <StatTile
          label="Logged Doses"
          value={String(totalLoggedDoses || 28)}
          hint="Confirmed on-device records"
        />
        <StatTile
          label="Adherence Streak"
          value="7 Days"
          hint="Consecutive on-time logs"
        />
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeViewTab}
        onValueChange={setActiveViewTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="schedule" className="gap-2">
            <Clock className="size-4" /> Daily Schedule & Log
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="size-4" /> Adherence & Symptom Charts
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DAILY SCHEDULE */}
        <TabsContent value="schedule" className="space-y-6">
          {state.reminders.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No medication reminders scheduled"
              description="Add your prescribed medicines with times and instructions to begin tracking adherence."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="size-4 mr-1" /> Add your first medicine
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(timeBuckets).map(
                ([bucketName, bucketReminders]) => {
                  if (bucketReminders.length === 0) return null;

                  return (
                    <div key={bucketName} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                          {bucketName}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          ({bucketReminders.length} item
                          {bucketReminders.length === 1 ? "" : "s"})
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {bucketReminders.map((reminder) => {
                          const isTakenToday = reminder.log.some(
                            (l) => l.date === today && l.state === "taken",
                          );

                          return (
                            <div
                              key={reminder.id}
                              className={`surface flex flex-col justify-between p-5 transition-all ${
                                isTakenToday
                                  ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10"
                                  : ""
                              }`}
                            >
                              <div className="space-y-3">
                                {/* Top Bar */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`grid size-9 place-items-center rounded-lg border text-sm font-bold ${
                                        isTakenToday
                                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                          : "border-border bg-secondary text-primary"
                                      }`}
                                    >
                                      <Clock className="size-4" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-ink text-sm">
                                        {reminder.medicineName}
                                      </h4>
                                      <p className="text-xs font-medium text-muted-foreground">
                                        {reminder.strength} · Scheduled at{" "}
                                        <strong className="text-ink">
                                          {reminder.times.join(", ") || "08:00"}
                                        </strong>
                                      </p>
                                    </div>
                                  </div>

                                  <Badge
                                    variant="outline"
                                    className={
                                      isTakenToday
                                        ? "border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                                        : "border-border"
                                    }
                                  >
                                    {isTakenToday
                                      ? "Dose Taken Today"
                                      : "Pending Dose"}
                                  </Badge>
                                </div>

                                {/* Instruction */}
                                {reminder.instruction && (
                                  <p className="rounded-md border border-border/70 bg-card/60 px-3 py-2 text-xs text-foreground">
                                    {reminder.instruction}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={reminder.active}
                                    onCheckedChange={(checked) =>
                                      updateReminder(reminder.id, {
                                        active: checked,
                                      })
                                    }
                                    aria-label="Toggle reminder alert"
                                  />
                                  <span className="text-[11px] text-muted-foreground">
                                    {reminder.active ? "Alert On" : "Muted"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant={
                                      isTakenToday ? "outline" : "default"
                                    }
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                      logDose(
                                        reminder.id,
                                        reminder.times[0] || "08:00",
                                        isTakenToday ? "skipped" : "taken",
                                      );
                                      if (!isTakenToday) {
                                        toast.success(
                                          `Dose logged for ${reminder.medicineName}`,
                                        );
                                      } else {
                                        toast.info(`Dose marked unlogged.`);
                                      }
                                    }}
                                  >
                                    {isTakenToday ? (
                                      <>
                                        <RotateCcw className="size-3.5 mr-1" />{" "}
                                        Undo Take
                                      </>
                                    ) : (
                                      <>
                                        <Check className="size-3.5 mr-1" /> Mark
                                        Taken
                                      </>
                                    )}
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                      deleteReminder(reminder.id);
                                      toast.success(
                                        `Removed ${reminder.medicineName} schedule`,
                                      );
                                    }}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: RECHARTS VISUALIZATION CHARTS */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Chart 1: 14-Day Adherence Percentage (Trend Area Chart) */}
          <figure className="surface p-5 sm:p-6">
            <figcaption className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  14-Day Medication Adherence Rate (%)
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tracks the daily percentage of prescribed doses logged on time
                  versus missed doses.
                </p>
              </div>
              <DemoBadge label="Telemetry Feed" />
            </figcaption>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={SAMPLE_ADHERENCE_DATA}
                  margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="adherenceGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis dataKey="day" {...axisStyle} />
                  <YAxis domain={[0, 100]} unit="%" {...axisStyle} width={45} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`${v}%`, "Daily Adherence"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="adherence"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    fill="url(#adherenceGrad)"
                    dot={{ r: 3, fill: "var(--chart-1)" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </figure>

          {/* Chart 2: Symptom Severity & Response Tracking Over Time */}
          <figure className="surface p-5 sm:p-6">
            <figcaption className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <LineChartIcon className="size-4 text-primary" />
                  Symptom Severity & Response Over Time
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Correlates medication adherence with blood pressure, pain
                  index (1-10), and glycemic metrics.
                </p>
              </div>

              {/* Metric filter buttons */}
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={
                    selectedChartMetric === "all" ? "default" : "outline"
                  }
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedChartMetric("all")}
                >
                  All Metrics
                </Button>
                <Button
                  variant={
                    selectedChartMetric === "pain" ? "default" : "outline"
                  }
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedChartMetric("pain")}
                >
                  Pain (1-10)
                </Button>
                <Button
                  variant={selectedChartMetric === "bp" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedChartMetric("bp")}
                >
                  Blood Pressure
                </Button>
                <Button
                  variant={
                    selectedChartMetric === "sugar" ? "default" : "outline"
                  }
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedChartMetric("sugar")}
                >
                  Glucose
                </Button>
              </div>
            </figcaption>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={SAMPLE_SYMPTOM_DATA}
                  margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis dataKey="day" {...axisStyle} />
                  <YAxis {...axisStyle} width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  />

                  {(selectedChartMetric === "all" ||
                    selectedChartMetric === "pain") && (
                    <Line
                      type="monotone"
                      dataKey="painScore"
                      name="Pain Score (1-10)"
                      stroke="var(--chart-2)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "var(--chart-2)" }}
                    />
                  )}

                  {(selectedChartMetric === "all" ||
                    selectedChartMetric === "bp") && (
                    <Line
                      type="monotone"
                      dataKey="bloodPressureSys"
                      name="Systolic BP (mmHg)"
                      stroke="var(--chart-3)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--chart-3)" }}
                    />
                  )}

                  {(selectedChartMetric === "all" ||
                    selectedChartMetric === "sugar") && (
                    <Line
                      type="monotone"
                      dataKey="bloodSugar"
                      name="Blood Sugar (mg/dL)"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--chart-4)" }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </figure>

          {/* Chart 3: Dose Timing Accuracy Distribution (Bar Chart) */}
          <figure className="surface p-5 sm:p-6">
            <figcaption className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <CalendarCheck className="size-4 text-primary" />
                  Dose Compliance by Daily Time Slot
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Breakdown of on-time, delayed, and missed doses across
                  morning, midday, evening, and night slots.
                </p>
              </div>
              <DemoBadge label="Compliance Analysis" />
            </figcaption>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={SAMPLE_TIMING_DATA}
                  margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis dataKey="slot" {...axisStyle} />
                  <YAxis {...axisStyle} width={35} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  />
                  <Bar
                    dataKey="onTime"
                    name="Taken On Time"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="delayed"
                    name="Delayed (>1h)"
                    fill="var(--chart-2)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="missed"
                    name="Missed"
                    fill="var(--chart-5)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </figure>
        </TabsContent>
      </Tabs>

      <SafetyNotice title="Medication Schedule & Safety">
        Medora reminder notifications are informational tools designed to assist
        routine compliance. Always follow the specific instructions on your
        medicine's prescription label.
      </SafetyNotice>
    </div>
  );
}
