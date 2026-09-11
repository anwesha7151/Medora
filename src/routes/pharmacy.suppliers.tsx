import { createFileRoute } from "@tanstack/react-router";
import { Handshake } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader, SafetyNotice } from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import {
  AsyncSection,
  StatusPill,
  WorkspaceSection,
} from "@/components/workspace/parts";
import { shortDate, useWorkspaceData } from "@/services/workspace";
import type { Supplier } from "@/data/workspace-demo";

export const Route = createFileRoute("/pharmacy/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers — Medora Pharmacy workspace" },
      {
        name: "description",
        content:
          "Supplier directory with lead time, on-time reliability and purchase order status from demo records.",
      },
      {
        property: "og:title",
        content: "Suppliers — Medora Pharmacy workspace",
      },
      {
        property: "og:description",
        content:
          "Review supplier lead time and reliability in the Medora pharmacy console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuppliersPage,
});

const statusMeta = {
  active: { label: "Active", tone: "positive" },
  review: { label: "Under review", tone: "warning" },
  paused: { label: "Paused", tone: "danger" },
} as const;

function isoDate(dateOnly: string) {
  return `${dateOnly}T00:00:00.000Z`;
}

function SuppliersPage() {
  const suppliers = useWorkspaceData("suppliers");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = suppliers.data ?? [];
  const open = rows.find((s) => s.id === openId) ?? null;

  const columns: DataColumn<Supplier>[] = [
    {
      key: "name",
      header: "Supplier",
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.contact}</p>
        </div>
      ),
    },
    {
      key: "leadTime",
      header: "Lead time",
      align: "right",
      hideBelow: "sm",
      sortValue: (r) => r.leadTimeDays,
      render: (r) => (
        <span
          className={
            r.leadTimeDays > 5 ? "font-medium text-destructive" : "numeric"
          }
        >
          {r.leadTimeDays} day{r.leadTimeDays === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "openPos",
      header: "Open POs",
      align: "right",
      hideBelow: "md",
      sortValue: (r) => r.openPurchaseOrders,
      render: (r) => <span className="numeric">{r.openPurchaseOrders}</span>,
    },
    {
      key: "onTime",
      header: "On-time rate",
      align: "right",
      sortValue: (r) => r.onTimeRate,
      render: (r) => (
        <span
          className={
            r.onTimeRate < 0.75
              ? "font-medium text-destructive"
              : r.onTimeRate < 0.9
                ? "font-medium text-warning-foreground"
                : "numeric"
          }
        >
          {Math.round(r.onTimeRate * 100)}%
        </span>
      ),
    },
    {
      key: "lastDelivery",
      header: "Last delivery",
      hideBelow: "lg",
      sortValue: (r) => r.lastDelivery,
      render: (r) => shortDate(isoDate(r.lastDelivery)),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => <StatusPill {...statusMeta[r.status]} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        demo
        description="Sample supplier directory for the pharmacy console. Lead time and reliability figures are demo records, last synced for this environment."
      />

      <SafetyNotice tone="info" title="Demo procurement figures">
        Lead times, purchase order counts and reliability rates are sample
        figures for reviewing this workflow. They are not a live procurement
        feed.
      </SafetyNotice>

      <WorkspaceSection
        title="Supplier directory"
        description="Suppliers with lead times over 5 days or an on-time rate under 75% are highlighted for review."
      >
        <AsyncSection
          query={suppliers}
          emptyIcon={Handshake}
          emptyTitle="No suppliers on file"
          emptyDescription="Suppliers will appear here once they are added to the pharmacy account."
          isEmpty={(d) => d.length === 0}
        >
          {(data) => (
            <DataTable
              rows={data}
              columns={columns}
              getId={(r) => r.id}
              searchText={(r) => `${r.name} ${r.contact}`}
              searchPlaceholder="Search suppliers…"
              initialSort={{ key: "onTime", direction: "asc" }}
              pageSize={7}
              filters={[
                {
                  key: "status",
                  label: "Status",
                  options: Object.entries(statusMeta).map(([value, meta]) => ({
                    value,
                    label: meta.label,
                  })),
                  predicate: (r, v) => r.status === v,
                },
                {
                  key: "reliability",
                  label: "Reliability",
                  options: [
                    { value: "poor", label: "Needs attention" },
                    { value: "good", label: "Reliable" },
                  ],
                  predicate: (r, v) =>
                    v === "poor"
                      ? r.onTimeRate < 0.75 || r.leadTimeDays > 5
                      : r.onTimeRate >= 0.75 && r.leadTimeDays <= 5,
                },
              ]}
              rowActions={(r) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenId(r.id)}
                >
                  View detail
                </Button>
              )}
            />
          )}
        </AsyncSection>
      </WorkspaceSection>

      <Dialog open={open != null} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent>
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.name}</DialogTitle>
                <DialogDescription>{open.contact}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Lead time
                  </dt>
                  <dd className="numeric mt-1 font-medium text-ink">
                    {open.leadTimeDays} days
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    On-time rate
                  </dt>
                  <dd className="numeric mt-1 font-medium text-ink">
                    {Math.round(open.onTimeRate * 100)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Open purchase orders
                  </dt>
                  <dd className="numeric mt-1 font-medium text-ink">
                    {open.openPurchaseOrders}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Last delivery
                  </dt>
                  <dd className="mt-1 font-medium text-ink">
                    {shortDate(isoDate(open.lastDelivery))}
                  </dd>
                </div>
              </dl>
              <StatusPill {...statusMeta[open.status]} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
