import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Layers,
  PackageCheck,
  Percent,
  Pill,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Timer,
  TrendingUp,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, StatTile } from "@/components/common/primitives";
import {
  ChartFrame,
  ChartLegend,
  CHART_COLORS,
  MultiLineChart,
  SimpleBarChart,
  StatusDonutChart,
  TrendAreaChart,
} from "@/components/workspace/charts";
import { AsyncSection, WorkspaceSection } from "@/components/workspace/parts";
import { money, shortDate, useWorkspaceData } from "@/services/workspace";

export const Route = createFileRoute("/pharmacy/analytics")({
  head: () => ({
    meta: [
      { title: "Dispensary Intelligence & Sales Analytics — Medora" },
      {
        name: "description",
        content:
          "Dispensary revenue velocity, therapeutic class breakdown, prescription turnaround metrics, payment channels, and inventory performance.",
      },
      {
        property: "og:title",
        content: "Dispensary Intelligence & Sales Analytics — Medora",
      },
    ],
  }),
  component: AnalyticsPage,
});

const periods = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Quarter to Date" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  awaiting_prescription: "#f59e0b",
  verifying: "#3b82f6",
  accepted: "#0d9488",
  preparing: "#8b5cf6",
  ready: "#10b981",
  completed: "#059669",
  cancelled: "#94a3b8",
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_prescription: "Awaiting Prescription",
  verifying: "Pharmacist Verification",
  accepted: "Accepted & Billed",
  preparing: "Dispensing & Packing",
  ready: "Ready for Dispatch",
  completed: "Delivered & Settled",
  cancelled: "Cancelled / Refunded",
};

const THERAPEUTIC_CATEGORIES = [
  {
    name: "Antibiotics & Anti-Infectives",
    share: 34,
    revenue: 60418,
    growth: "+18.2%",
  },
  {
    name: "Analgesics & Antipyretics",
    share: 28,
    revenue: 49756,
    growth: "+24.5%",
  },
  {
    name: "Cardiometabolic & Antidiabetic",
    share: 18,
    revenue: 31986,
    growth: "+12.1%",
  },
  {
    name: "Respiratory & Anti-Allergics",
    share: 12,
    revenue: 21324,
    growth: "+31.0%",
  },
  {
    name: "Gastrointestinal & Proton Inhibitors",
    share: 8,
    revenue: 14216,
    growth: "+8.4%",
  },
];

const PAYMENT_CHANNELS = [
  { name: "Instant UPI QR (PhonePe/GPay)", value: 64, color: "#0d9488" },
  { name: "Credit / Debit Cards (3D Secure)", value: 24, color: "#2563eb" },
  { name: "NetBanking / Corporate", value: 7, color: "#8b5cf6" },
  { name: "Cash on Delivery (COD)", value: 5, color: "#f59e0b" },
];

function AnalyticsPage() {
  const sales = useWorkspaceData("sales");
  const orders = useWorkspaceData("pharmacyOrders");
  const inventory = useWorkspaceData("inventory");
  const [period, setPeriod] = useState<string>("7");

  const salesRows = sales.data ?? [];
  const slicedSales = useMemo(() => {
    const days = parseInt(period, 10) || 7;
    const n = Math.min(days, salesRows.length);
    return salesRows.slice(-n);
  }, [salesRows, period]);

  const totalRevenue = slicedSales.reduce((s, p) => s + p.revenue, 0);
  const totalOrders = slicedSales.reduce((s, p) => s + p.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const orderRows = orders.data ?? [];
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orderRows) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return counts;
  }, [orderRows]);

  const donutData = Object.entries(statusCounts).map(([status, value]) => ({
    name: STATUS_LABELS[status] ?? status,
    value,
    color: STATUS_COLORS[status] ?? "#0d9488",
  }));

  const inventoryRows = inventory.data ?? [];
  const lowStockCount = inventoryRows.filter(
    (i) => i.stock <= i.reorderLevel,
  ).length;

  const restockBar = useMemo(() => {
    return inventoryRows
      .map((i) => ({
        name: i.name.split(" ")[0] ?? i.name,
        stock: i.stock,
        reorder: i.reorderLevel,
      }))
      .slice(0, 6);
  }, [inventoryRows]);

  // Export Analytics Summary CSV
  const handleExportReport = () => {
    const rows = [
      ["Metric", "Value", "Period"],
      [
        "Gross Revenue",
        `INR ${totalRevenue.toFixed(2)}`,
        `Last ${period} days`,
      ],
      [
        "Total Prescriptions Dispensed",
        String(totalOrders),
        `Last ${period} days`,
      ],
      [
        "Average Order Value",
        `INR ${avgOrderValue.toFixed(2)}`,
        `Last ${period} days`,
      ],
      ["Low Stock Lines", String(lowStockCount), "Current Active"],
      [""],
      ["Therapeutic Category", "Market Share (%)", "Revenue (INR)", "Growth"],
      ...THERAPEUTIC_CATEGORIES.map((c) => [
        c.name,
        `${c.share}%`,
        `INR ${c.revenue}`,
        c.growth,
      ]),
    ];
    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Medora_Dispensary_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics Intelligence Report Exported (.CSV)");
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Dispensary Intelligence & Analytics"
        demo
        description="Comprehensive operational performance, revenue velocity, therapeutic class demand, and prescription fulfillment efficiency."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              className="h-9 px-3 text-xs font-bold gap-1.5"
            >
              <Download className="size-3.5 text-primary" />
              Export Report
            </Button>

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger
                className="w-[160px] h-9 text-xs font-bold"
                aria-label="Select period"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <AsyncSection
        query={sales}
        emptyIcon={BarChart3}
        emptyTitle="No sales analytics recorded"
        emptyDescription="Sales figures will populate once orders are billed and dispensed."
        isEmpty={(d) => d.length === 0}
      >
        {() => (
          <>
            {/* Primary KPI Grid */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <IndianRupee className="size-3.5 text-primary" /> Gross
                    Revenue
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    <ArrowUpRight className="size-3" /> +18.4%
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-extrabold text-ink">
                    {money(totalRevenue)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {periods.find((p) => p.value === period)?.label}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShoppingCart className="size-3.5 text-blue-500" />{" "}
                    Prescriptions Dispensed
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                    <ArrowUpRight className="size-3" /> +12.1%
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-extrabold text-ink">
                    {totalOrders}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    orders billed
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-amber-500" /> Avg
                    Basket Value
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                    Optimal
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-extrabold text-ink">
                    {money(avgOrderValue)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    per prescription
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Timer className="size-3.5 text-emerald-500" /> Rx
                    Turnaround Velocity
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  >
                    99.2% SLA
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-extrabold text-ink">
                    12.4 min
                  </span>
                  <span className="text-xs text-muted-foreground">
                    verification to pack
                  </span>
                </div>
              </div>
            </div>

            {/* Main Interactive Charts Row */}
            <div className="grid gap-6 xl:grid-cols-2">
              <ChartFrame
                title="Revenue Velocity Trend (₹)"
                description={`Daily dispensary gross revenue over the ${periods.find((p) => p.value === period)?.label.toLowerCase()}.`}
              >
                <TrendAreaChart
                  data={slicedSales.map((p) => ({
                    ...p,
                    day: shortDate(`${p.date}T00:00:00.000Z`),
                  }))}
                  xKey="day"
                  yKey="revenue"
                  label="Revenue"
                />
              </ChartFrame>

              <ChartFrame
                title="Prescription Volume (Daily Units)"
                description="Daily dispensed prescription count across the selected window."
              >
                <SimpleBarChart
                  data={slicedSales.map((p) => ({
                    ...p,
                    day: shortDate(`${p.date}T00:00:00.000Z`),
                  }))}
                  xKey="day"
                  yKey="orders"
                  label="Prescriptions"
                />
              </ChartFrame>
            </div>
          </>
        )}
      </AsyncSection>

      {/* Secondary Operational Analytics Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Orders by Pipeline Stage */}
        <AsyncSection
          query={orders}
          emptyIcon={ShoppingCart}
          emptyTitle="No orders yet"
          emptyDescription="Order pipeline breakdown will appear once orders are placed."
          isEmpty={(d) => d.length === 0}
        >
          {() => (
            <ChartFrame
              title="Prescription Pipeline Status"
              description="Live distribution of active orders across verification and dispatch."
              height={280}
            >
              <StatusDonutChart data={donutData} />
            </ChartFrame>
          )}
        </AsyncSection>

        {/* Top Therapeutic Categories */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/20 text-primary">
                  <Pill className="size-4" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-ink">
                    Therapeutic Class Share
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Top revenue generating categories
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-primary">
                CDSCO Formulary
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {THERAPEUTIC_CATEGORIES.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground truncate max-w-[200px]">
                      {cat.name}
                    </span>
                    <span className="text-ink font-bold">{cat.share}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${cat.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Formulary Coverage: 100%</span>
            <span className="font-bold text-emerald-600">
              Verified CDSCO IP
            </span>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-blue-500/20 text-blue-600">
                  <CreditCard className="size-4" />
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-ink">
                    Payment Channel Mix
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Settlement distribution
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600">
                99.8% Auto-Settled
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {PAYMENT_CHANNELS.map((ch) => (
                <div
                  key={ch.name}
                  className="rounded-xl border border-border/50 bg-muted/30 p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ background: ch.color }}
                    />
                    <span className="font-medium text-foreground">
                      {ch.name}
                    </span>
                  </div>
                  <strong className="font-mono font-bold text-ink">
                    {ch.value}%
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Instant UPI Gateway Active</span>
            <span className="font-mono font-bold text-ink">
              T+0 Settlements
            </span>
          </div>
        </div>
      </div>

      {/* Stock Health vs Reorder Limits */}
      <AsyncSection
        query={inventory}
        emptyIcon={PackageCheck}
        emptyTitle="No inventory records"
        emptyDescription="Stock levels will appear once inventory is loaded."
        isEmpty={(d) => d.length === 0}
      >
        {() => (
          <ChartFrame
            title="Fast-Moving SKU Stock vs Reorder Thresholds"
            description="Real-time available units vs minimum reorder envelopes across top dispensary formulations."
          >
            <SimpleBarChart
              data={restockBar}
              xKey="name"
              yKey="stock"
              label="Units in stock"
            />
          </ChartFrame>
        )}
      </AsyncSection>

      {/* Order Status Legend Footer */}
      <WorkspaceSection
        title="Dispensary Pipeline Status Index"
        description="Color definitions and workflow states used across the analytics dashboard."
      >
        <ChartLegend
          items={donutData.map((d) => ({
            label: d.name,
            color: d.color ?? "#0d9488",
          }))}
        />
      </WorkspaceSection>
    </div>
  );
}
