import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  HandCoins,
  IndianRupee,
  Receipt,
  Search,
  Send,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  SafetyNotice,
  StatTile,
} from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import { WorkspaceSection, StatusPill } from "@/components/workspace/parts";
import { money } from "@/services/workspace";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({
    meta: [
      { title: "Marketplace Revenue, Payouts & GST Ledger — Medora Admin" },
      {
        name: "description",
        content:
          "National healthcare marketplace GMV, instant UPI settlements, pharmacy payout disbursement batches, and GST e-invoicing.",
      },
      {
        property: "og:title",
        content: "Marketplace Revenue & GST Ledger — Medora Admin",
      },
    ],
  }),
  component: RevenueAdminPage,
});

interface PayoutRecord {
  id: string;
  pharmacyName: string;
  bankAccount: string;
  grossAmount: number;
  platformFee: number;
  gstAmount: number;
  netPayout: number;
  ordersCount: number;
  period: string;
  status: "pending" | "settled" | "processing";
  utrNumber?: string;
}

const DEMO_PAYOUTS: PayoutRecord[] = [
  {
    id: "PAY-2026-8801",
    pharmacyName: "Apollo Pharmacy — Bandra West (Mumbai)",
    bankAccount: "HDFC •••• 4910",
    grossAmount: 184500,
    platformFee: 14760,
    gstAmount: 2656.8,
    netPayout: 167083.2,
    ordersCount: 142,
    period: "10 Aug - 16 Aug 2026",
    status: "settled",
    utrNumber: "HDFC9402819401",
  },
  {
    id: "PAY-2026-8802",
    pharmacyName: "MedPlus Chemist — Koramangala (Bengaluru)",
    bankAccount: "ICICI •••• 9921",
    grossAmount: 142000,
    platformFee: 11360,
    gstAmount: 2044.8,
    netPayout: 128595.2,
    ordersCount: 118,
    period: "10 Aug - 16 Aug 2026",
    status: "pending",
  },
  {
    id: "PAY-2026-8803",
    pharmacyName: "Manipal Hospital Pharmacy (Bengaluru)",
    bankAccount: "SBI •••• 1042",
    grossAmount: 218400,
    platformFee: 17472,
    gstAmount: 3144.96,
    netPayout: 197783.04,
    ordersCount: 176,
    period: "10 Aug - 16 Aug 2026",
    status: "settled",
    utrNumber: "SBIN8492019482",
  },
  {
    id: "PAY-2026-8804",
    pharmacyName: "Fortis Health Chemist (New Delhi)",
    bankAccount: "AXIS •••• 3381",
    grossAmount: 96800,
    platformFee: 7744,
    gstAmount: 1393.92,
    netPayout: 87662.08,
    ordersCount: 79,
    period: "10 Aug - 16 Aug 2026",
    status: "pending",
  },
  {
    id: "PAY-2026-8805",
    pharmacyName: "Apollo Pharmacy — Indiranagar (Bengaluru)",
    bankAccount: "HDFC •••• 7719",
    grossAmount: 168200,
    platformFee: 13456,
    gstAmount: 2422.08,
    netPayout: 152321.92,
    ordersCount: 134,
    period: "10 Aug - 16 Aug 2026",
    status: "settled",
    utrNumber: "HDFC1049281948",
  },
];

function RevenueAdminPage() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>(DEMO_PAYOUTS);
  const [filterQuery, setFilterQuery] = useState("");

  const filteredPayouts = useMemo(() => {
    if (!filterQuery.trim()) return payouts;
    const q = filterQuery.toLowerCase();
    return payouts.filter(
      (p) =>
        p.pharmacyName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.bankAccount.toLowerCase().includes(q),
    );
  }, [payouts, filterQuery]);

  const totalGmv = payouts.reduce((sum, p) => sum + p.grossAmount, 0);
  const totalCommission = payouts.reduce((sum, p) => sum + p.platformFee, 0);
  const totalGst = payouts.reduce((sum, p) => sum + p.gstAmount, 0);
  const pendingPayoutTotal = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.netPayout, 0);

  const handleDisburseAll = () => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.status === "pending"
          ? {
              ...p,
              status: "settled",
              utrNumber: `NEFT${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            }
          : p,
      ),
    );
    toast.success("Batch Payout Disbursements Executed", {
      description: `Disbursed ${money(pendingPayoutTotal)} to registered dispensary bank accounts via IMPS/NEFT.`,
    });
  };

  const handleExportLedger = () => {
    const headers = [
      "Payout Batch ID",
      "Pharmacy Name",
      "Bank Account",
      "Gross Marketplace Volume (INR)",
      "Medora Platform Fee (INR)",
      "18% GST (INR)",
      "Net Payout (INR)",
      "Orders Count",
      "Settlement Cycle",
      "Status",
      "Bank UTR Ref",
    ];

    const rows = payouts.map((p) => [
      `"${p.id}"`,
      `"${p.pharmacyName.replace(/"/g, '""')}"`,
      `"${p.bankAccount}"`,
      p.grossAmount.toFixed(2),
      p.platformFee.toFixed(2),
      p.gstAmount.toFixed(2),
      p.netPayout.toFixed(2),
      p.ordersCount,
      `"${p.period}"`,
      `"${p.status.toUpperCase()}"`,
      `"${p.utrNumber || "N/A"}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Medora_Marketplace_Revenue_GST_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success("Revenue & GST Ledger Exported (.CSV)");
  };

  const columns: DataColumn<PayoutRecord>[] = [
    {
      key: "pharmacy",
      header: "Pharmacy / Beneficiary",
      sortValue: (r) => r.pharmacyName,
      render: (r) => (
        <div>
          <p className="font-bold text-ink">{r.pharmacyName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {r.bankAccount}
          </p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Cycle & Orders",
      hideBelow: "md",
      sortValue: (r) => r.ordersCount,
      render: (r) => (
        <div>
          <span className="text-xs font-medium text-foreground">
            {r.period}
          </span>
          <p className="text-[11px] text-muted-foreground">
            {r.ordersCount} orders cleared
          </p>
        </div>
      ),
    },
    {
      key: "gross",
      header: "Gross GMV",
      align: "right",
      sortValue: (r) => r.grossAmount,
      render: (r) => (
        <span className="font-mono text-xs font-bold text-foreground">
          {money(r.grossAmount)}
        </span>
      ),
    },
    {
      key: "net",
      header: "Net Dispensary Payout",
      align: "right",
      sortValue: (r) => r.netPayout,
      render: (r) => (
        <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
          {money(r.netPayout)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Settlement Status",
      sortValue: (r) => r.status,
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <StatusPill
            label={r.status === "settled" ? "Disbursed" : "Pending Payout"}
            tone={r.status === "settled" ? "positive" : "warning"}
          />
          {r.utrNumber && (
            <span className="font-mono text-[9px] text-muted-foreground truncate max-w-[110px]">
              UTR: {r.utrNumber}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Marketplace Revenue, Payouts & GST Ledger"
        demo
        description="National healthcare marketplace settlements, 18% GST E-Invoicing compliance, pharmacy merchant fee reconciliation, and automated bank disbursement batches."
      />

      {/* Top Financial KPI Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Gross Marketplace Volume (GMV)"
          value={money(totalGmv)}
          icon={TrendingUp}
          hint="Total prescription value cleared"
        />
        <StatTile
          label="Medora Platform Net Fee (8%)"
          value={money(totalCommission)}
          icon={HandCoins}
          tone="positive"
          hint="Gross platform revenue"
        />
        <StatTile
          label="18% Healthcare GST Collected"
          value={money(totalGst)}
          icon={Receipt}
          hint="CGST (9%) + SGST (9%) e-invoiced"
        />
        <StatTile
          label="Pending Chemist Disbursements"
          value={money(pendingPayoutTotal)}
          icon={Wallet}
          tone={pendingPayoutTotal > 0 ? "attention" : "default"}
          hint="Awaiting weekly bank batch clearance"
        />
      </div>

      <SafetyNotice
        tone="info"
        title="Automated GST E-Invoicing & DPDP Compliant Payment Processing"
      >
        All customer payments are routed through RBI-licensed UPI and payment
        aggregators with instant 3D Secure verification. Payouts to verified
        pharmacies are batched with automated Form 16 / GSTR-1 tax filings.
      </SafetyNotice>

      {/* Action Toolbar */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
            <Receipt className="size-4 text-primary" />
            Weekly Merchant Payout Disbursement Queue
          </h3>
          <p className="text-xs text-muted-foreground">
            Review calculated commissions, deducted GST, and trigger instant
            NEFT/IMPS bank payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLedger}
            className="h-9 font-bold text-xs gap-1.5 rounded-xl"
          >
            <Download className="size-3.5" />
            Export GST Ledger (.CSV)
          </Button>

          <Button
            size="sm"
            disabled={pendingPayoutTotal === 0}
            onClick={handleDisburseAll}
            className="h-9 font-bold text-xs gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft"
          >
            <Send className="size-4" />
            Disburse All Pending Payouts ({money(pendingPayoutTotal)})
          </Button>
        </div>
      </div>

      {/* Payout Data Table */}
      <WorkspaceSection
        title="Settlement Records & Tax Ledger"
        description="Filter by chemist, hospital branch, or settlement status."
      >
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search pharmacy or bank account…"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <DataTable
              rows={filteredPayouts}
              columns={columns}
              getId={(r) => r.id}
              searchText={(r) => `${r.pharmacyName} ${r.bankAccount} ${r.id}`}
              initialSort={{ key: "gross", direction: "desc" }}
              pageSize={6}
              rowActions={(r) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.info(`E-Invoice IRN: 9481029481902481920`, {
                      description: `GSTIN: 27AABCM9841P1Z9 · Downloaded digitally signed XML.`,
                    });
                  }}
                  className="h-7 text-xs font-bold gap-1 rounded-xl"
                >
                  <FileText className="size-3" />
                  E-Invoice
                </Button>
              )}
            />
          </div>
        </div>
      </WorkspaceSection>
    </div>
  );
}
