import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Users } from "lucide-react";
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
import { money, shortDate, useWorkspaceData } from "@/services/workspace";
import type { PharmacyCustomer } from "@/data/workspace-demo";

export const Route = createFileRoute("/pharmacy/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Medora Pharmacy workspace" },
      {
        name: "description",
        content:
          "Pharmacy customer directory with order history, lifetime spend and account flags from demo records.",
      },
      {
        property: "og:title",
        content: "Customers — Medora Pharmacy workspace",
      },
      {
        property: "og:description",
        content:
          "Search, filter and review customer records in the Medora pharmacy console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersPage,
});

function isoDate(dateOnly: string) {
  return `${dateOnly}T00:00:00.000Z`;
}

function CustomersPage() {
  const customers = useWorkspaceData("customers");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = customers.data ?? [];
  const open = rows.find((c) => c.id === openId) ?? null;

  const columns: DataColumn<PharmacyCustomer>[] = [
    {
      key: "name",
      header: "Customer",
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-xs text-muted-foreground">
            Customer since {shortDate(isoDate(r.since))}
          </p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Marketing consent",
      hideBelow: "md",
      sortValue: (r) => (r.consentMarketing ? 1 : 0),
      render: (r) => (
        <StatusPill
          label={r.consentMarketing ? "Consented" : "Not consented"}
          tone={r.consentMarketing ? "positive" : "neutral"}
        />
      ),
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      sortValue: (r) => r.orders,
      render: (r) => <span className="numeric">{r.orders}</span>,
    },
    {
      key: "spend",
      header: "Lifetime value",
      align: "right",
      hideBelow: "sm",
      sortValue: (r) => r.spend,
      render: (r) => <span className="numeric">{money(r.spend)}</span>,
    },
    {
      key: "lastOrder",
      header: "Last seen",
      hideBelow: "lg",
      sortValue: (r) => r.lastOrder,
      render: (r) => shortDate(isoDate(r.lastOrder)),
    },
    {
      key: "flags",
      header: "Flags",
      hideBelow: "lg",
      sortValue: (r) => r.flags.length,
      render: (r) =>
        r.flags.length ? (
          <StatusPill
            label={`${r.flags.length} flag${r.flags.length > 1 ? "s" : ""}`}
            tone="warning"
          />
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        demo
        description="Sample customer directory for the pharmacy console. Order history and spend are demo figures."
      />

      <SafetyNotice tone="info" title="Contact details are demo records">
        Names, contact preferences and order history shown here are sample data
        for reviewing this workflow. In production, patient contact details are
        handled under applicable data-protection and pharmacy confidentiality
        requirements and are never shown to unauthorised staff.
      </SafetyNotice>

      <WorkspaceSection
        title="Customer directory"
        description="Search, filter and open a customer to see their order history."
      >
        <AsyncSection
          query={customers}
          emptyIcon={Users}
          emptyTitle="No customers yet"
          emptyDescription="Customer records will appear here once orders are placed."
          isEmpty={(d) => d.length === 0}
        >
          {(data) => (
            <DataTable
              rows={data}
              columns={columns}
              getId={(r) => r.id}
              searchText={(r) => `${r.name} ${r.flags.join(" ")}`}
              searchPlaceholder="Search customers or flags…"
              initialSort={{ key: "spend", direction: "desc" }}
              pageSize={7}
              filters={[
                {
                  key: "consent",
                  label: "Marketing",
                  options: [
                    { value: "yes", label: "Consented" },
                    { value: "no", label: "Not consented" },
                  ],
                  predicate: (r, v) =>
                    v === "yes" ? r.consentMarketing : !r.consentMarketing,
                },
                {
                  key: "flags",
                  label: "Flags",
                  options: [
                    { value: "flagged", label: "Has flags" },
                    { value: "clear", label: "No flags" },
                  ],
                  predicate: (r, v) =>
                    v === "flagged" ? r.flags.length > 0 : r.flags.length === 0,
                },
              ]}
              rowActions={(r) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenId(r.id)}
                >
                  View history
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
                <DialogDescription>
                  Customer since {shortDate(isoDate(open.since))} · last order{" "}
                  {shortDate(isoDate(open.lastOrder))}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Orders
                  </dt>
                  <dd className="numeric mt-1 font-medium text-ink">
                    {open.orders}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Lifetime value
                  </dt>
                  <dd className="numeric mt-1 font-medium text-ink">
                    {money(open.spend)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Marketing consent
                  </dt>
                  <dd className="mt-1">
                    <StatusPill
                      label={
                        open.consentMarketing ? "Consented" : "Not consented"
                      }
                      tone={open.consentMarketing ? "positive" : "neutral"}
                    />
                  </dd>
                </div>
              </dl>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Account flags
                </p>
                {open.flags.length ? (
                  <ul className="space-y-1 text-sm">
                    {open.flags.map((f) => (
                      <li key={f} className="rounded-md bg-secondary px-2 py-1">
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No flags recorded.
                  </p>
                )}
              </div>
              <p className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" aria-hidden /> Demo record —
                no real contact details are stored or displayed here.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
