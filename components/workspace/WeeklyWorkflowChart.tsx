import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/common/primitives";
import { cn } from "@/lib/utils";

interface WeeklyWorkflowDataPoint {
  day: string;
  shortDay: string;
  consultations: number;
  prescriptions: number;
  reviews: number;
  triage: number;
  total: number;
}

const DEFAULT_WEEKLY_DATA: WeeklyWorkflowDataPoint[] = [
  {
    day: "Monday",
    shortDay: "Mon",
    consultations: 24,
    prescriptions: 19,
    reviews: 8,
    triage: 14,
    total: 65,
  },
  {
    day: "Tuesday",
    shortDay: "Tue",
    consultations: 28,
    prescriptions: 22,
    reviews: 11,
    triage: 16,
    total: 77,
  },
  {
    day: "Wednesday",
    shortDay: "Wed",
    consultations: 32,
    prescriptions: 27,
    reviews: 14,
    triage: 19,
    total: 92,
  },
  {
    day: "Thursday",
    shortDay: "Thu",
    consultations: 26,
    prescriptions: 21,
    reviews: 9,
    triage: 15,
    total: 71,
  },
  {
    day: "Friday",
    shortDay: "Fri",
    consultations: 35,
    prescriptions: 30,
    reviews: 16,
    triage: 22,
    total: 103,
  },
  {
    day: "Saturday",
    shortDay: "Sat",
    consultations: 18,
    prescriptions: 14,
    reviews: 6,
    triage: 12,
    total: 50,
  },
  {
    day: "Sunday",
    shortDay: "Sun",
    consultations: 8,
    prescriptions: 6,
    reviews: 3,
    triage: 9,
    total: 26,
  },
];

const axisStyle = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const customTooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
  color: "var(--color-ink)",
  boxShadow: "var(--shadow-soft)",
} as const;

interface WeeklyWorkflowChartProps {
  data?: WeeklyWorkflowDataPoint[];
  className?: string;
}

export function WeeklyWorkflowChart({
  data = DEFAULT_WEEKLY_DATA,
  className,
}: WeeklyWorkflowChartProps) {
  const [activeSeries, setActiveSeries] = useState<
    "all" | "consultations" | "prescriptions" | "reviews"
  >("all");

  const totalWeekly = data.reduce((acc, curr) => acc + curr.total, 0);
  const totalConsults = data.reduce((acc, curr) => acc + curr.consultations, 0);
  const totalPrescriptions = data.reduce(
    (acc, curr) => acc + curr.prescriptions,
    0,
  );
  const peakDay = [...data].sort((a, b) => b.total - a.total)[0] ?? data[0] ?? { day: "Mon", total: 0 };

  return (
    <figure
      id="weekly-clinical-workflow-chart"
      className={cn("surface rise p-5 shadow-soft", className)}
    >
      {/* Header */}
      <figcaption className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary-soft text-primary">
              <TrendingUp className="size-4" />
            </span>
            <h3 className="font-display text-sm font-bold text-ink">
              Weekly Clinical Workflow Volume
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Day-by-day distribution of consultations, e-prescriptions issued,
            and case reviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DemoBadge label="Live Clinic Telemetry" />
        </div>
      </figcaption>

      {/* Quick Summary Highlights */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-y border-border py-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Weekly Total
          </span>
          <p className="numeric font-display text-base font-bold text-ink">
            {totalWeekly}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Consultations
          </span>
          <p className="numeric font-display text-base font-bold text-primary">
            {totalConsults}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Prescriptions
          </span>
          <p className="numeric font-display text-base font-bold text-chart-2">
            {totalPrescriptions}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Peak Activity
          </span>
          <p className="font-display text-xs font-bold text-ink">
            {peakDay.day} ({peakDay.total})
          </p>
        </div>
      </div>

      {/* Series Filters */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveSeries("all")}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              activeSeries === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80",
            )}
          >
            All Streams
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries("consultations")}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              activeSeries === "consultations"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80",
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: "var(--color-primary)" }}
            />
            Consultations
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries("prescriptions")}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              activeSeries === "prescriptions"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80",
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: "var(--color-chart-2)" }}
            />
            Prescriptions
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries("reviews")}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              activeSeries === "reviews"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80",
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: "var(--color-chart-3)" }}
            />
            Reviews
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ left: -16, right: 12, top: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis dataKey="shortDay" {...axisStyle} />
            <YAxis {...axisStyle} width={42} />
            <Tooltip
              contentStyle={customTooltipStyle}
              formatter={(val: number, name: string) => [
                val,
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: 12,
                color: "var(--color-muted-foreground)",
              }}
            />

            {(activeSeries === "all" || activeSeries === "consultations") && (
              <Line
                type="monotone"
                dataKey="consultations"
                name="Consultations"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 1 }}
                activeDot={{
                  r: 6,
                  stroke: "var(--color-card)",
                  strokeWidth: 2,
                }}
              />
            )}

            {(activeSeries === "all" || activeSeries === "prescriptions") && (
              <Line
                type="monotone"
                dataKey="prescriptions"
                name="Prescriptions"
                stroke="var(--color-chart-2)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-chart-2)", strokeWidth: 1 }}
                activeDot={{
                  r: 6,
                  stroke: "var(--color-card)",
                  strokeWidth: 2,
                }}
              />
            )}

            {(activeSeries === "all" || activeSeries === "reviews") && (
              <Line
                type="monotone"
                dataKey="reviews"
                name="Follow-ups"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "var(--color-chart-3)" }}
              />
            )}

            {activeSeries === "all" && (
              <Line
                type="monotone"
                dataKey="triage"
                name="Triage"
                stroke="var(--color-chart-4)"
                strokeWidth={1.8}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
