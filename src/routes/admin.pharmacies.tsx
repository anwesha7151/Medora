import { createFileRoute } from "@tanstack/react-router";
import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import {
  AsyncSection,
  StatusPill,
  Timeline,
  WorkspaceSection,
} from "@/components/workspace/parts";
import {
  shortDate,
  shortDateTime,
  useWorkspaceData,
} from "@/services/workspace";
import type { OrganisationRecord } from "@/data/workspace-demo";

export const Route = createFileRoute("/admin/pharmacies")({
  head: () => ({
    meta: [
      { title: "Organisations — Medora Admin workspace" },
      {
        name: "description",
        content:
          "Review pharmacy and clinic licence records and record verification decisions as a named administrator.",
      },
      {
        property: "og:title",
        content: "Organisations — Medora Admin workspace",
      },
      {
        property: "og:description",
        content:
          "Administrator licence verification workflow for pharmacies and clinics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganisationsPage,
});

const verificationTone = {
  verified: "positive",
  pending: "warning",
  expired: "danger",
} as const;

const verificationLabel = {
  verified: "Verified",
  pending: "Pending",
  expired: "Expired",
} as const;

interface Decision {
  id: string;
  orgId: string;
  orgName: string;
  outcome: "approved" | "rejected";
  at: string;
}

function OrganisationsPage() {
  const orgs = useWorkspaceData("organisations");
  const [openId, setOpenId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<
    Record<string, OrganisationRecord["verification"]>
  >({});
  const [decisions, setDecisions] = useState<Decision[]>([]);

  const rows = orgs.data ?? [];
  const selected = rows.find((o) => o.id === openId) ?? null;
  const selectedStatus = selected
    ? (overrides[selected.id] ?? selected.verification)
    : undefined;

  const columns: DataColumn<OrganisationRecord>[] = [
    {
      key: "name",
      header: "Organisation",
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-xs text-muted-foreground">
            {r.kind === "pharmacy" ? "Pharmacy" : "Clinic"} · {r.city}
          </p>
        </div>
      ),
    },
    {
      key: "licenceId",
      header: "Licence ID",
      hideBelow: "md",
      sortValue: (r) => r.licenceId,
      render: (r) => <span className="numeric text-sm">{r.licenceId}</span>,
    },
    {
      key: "city",
      header: "Jurisdiction",
      hideBelow: "lg",
      sortValue: (r) => r.city,
      render: (r) => r.city,
    },
    {
      key: "verification",
      header: "Verification",
      sortValue: (r) => r.verification,
      render: (r) => {
        const status = overrides[r.id] ?? r.verification;
        return (
          <StatusPill
            label={verificationLabel[status]}
            tone={verificationTone[status]}
          />
        );
      },
    },
    {
      key: "onboarded",
      header: "Registered",
      hideBelow: "sm",
      sortValue: (r) => r.onboarded,
      render: (r) => shortDate(`${r.onboarded}T00:00:00.000Z`),
    },
  ];

  const recordDecision = (
    org: OrganisationRecord,
    outcome: "approved" | "rejected",
  ) => {
    const nextStatus: OrganisationRecord["verification"] =
      outcome === "approved" ? "verified" : "expired";
    setOverrides((prev) => ({ ...prev, [org.id]: nextStatus }));
    setDecisions((prev) => [
      {
        id: `dec-${Date.now()}`,
        orgId: org.id,
        orgName: org.name,
        outcome,
        at: new Date().toISOString(),
      },
      ...prev,
    ]);
    toast.success(
      `Recorded: you ${outcome === "approved" ? "approved" : "rejected"} the licence for ${org.name} (this session)`,
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisations"
        demo
        description="Sample pharmacy and clinic records. Licence verification is a decision a named administrator records here — nothing is auto-approved."
      />

      <WorkspaceSection
        title="Registered organisations"
        description="Filter by verification status and open a record to review its licence evidence."
      >
        <AsyncSection
          query={orgs}
          emptyIcon={Building2}
          emptyTitle="No organisations found"
          emptyDescription="Registered pharmacies and clinics will appear here."
          isEmpty={(d) => d.length === 0}
        >
          {(data) => (
            <DataTable
              rows={data}
              columns={columns}
              getId={(r) => r.id}
              searchText={(r) => `${r.name} ${r.licenceId} ${r.city}`}
              searchPlaceholder="Search by name, licence or city…"
              initialSort={{ key: "name", direction: "asc" }}
              pageSize={8}
              filters={[
                {
                  key: "verification",
                  label: "Verification",
                  options: Object.entries(verificationLabel).map(
                    ([value, label]) => ({
                      value,
                      label,
                    }),
                  ),
                  predicate: (r, v) =>
                    (overrides[r.id] ?? r.verification) === v,
                },
              ]}
              onRowClick={(r) => setOpenId(r.id)}
              rowActions={(r) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenId(r.id)}
                >
                  Review
                </Button>
              )}
            />
          )}
        </AsyncSection>
      </WorkspaceSection>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setOpenId(null)}
      >
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  {selected.kind === "pharmacy" ? "Pharmacy" : "Clinic"} ·{" "}
                  {selected.city}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Licence ID
                  </dt>
                  <dd className="numeric mt-0.5">{selected.licenceId}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Contact
                  </dt>
                  <dd className="mt-0.5">{selected.contact}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Registered
                  </dt>
                  <dd className="mt-0.5">
                    {shortDate(`${selected.onboarded}T00:00:00.000Z`)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current status
                  </dt>
                  <dd className="mt-0.5">
                    <StatusPill
                      label={verificationLabel[selectedStatus!]}
                      tone={verificationTone[selectedStatus!]}
                    />
                  </dd>
                </div>
              </dl>

              <div className="rounded-md border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
                Licence evidence on file (sample): scanned licence document{" "}
                {selected.licenceId}, submitted at onboarding on{" "}
                {shortDate(`${selected.onboarded}T00:00:00.000Z`)}. This is demo
                evidence only — no live regulatory registry is connected.
              </div>

              <p className="text-xs text-muted-foreground">
                Approving or rejecting here records a decision made by you, the
                signed-in administrator, in this session's audit trail. It does
                not call a live regulator.
              </p>

              <DialogFooter className="gap-2 sm:justify-start">
                <Button onClick={() => recordDecision(selected, "approved")}>
                  <CheckCircle2 className="size-4" aria-hidden /> Approve
                  licence
                </Button>
                <Button
                  variant="outline"
                  onClick={() => recordDecision(selected, "rejected")}
                >
                  <XCircle className="size-4" aria-hidden /> Reject licence
                </Button>
                <Button variant="ghost" onClick={() => setOpenId(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <WorkspaceSection
        title="Verification decisions"
        description="Every approval or rejection recorded in this session, attributable to the administrator who made it."
      >
        <Timeline
          items={decisions.map((d) => ({
            id: d.id,
            at: shortDateTime(d.at),
            title: `${d.orgName}: licence ${d.outcome}`,
            meta: "You (this session)",
          }))}
        />
      </WorkspaceSection>
    </div>
  );
}
