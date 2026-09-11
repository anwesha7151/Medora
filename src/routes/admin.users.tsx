import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { PlatformUser } from "@/data/workspace-demo";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Medora Admin workspace" },
      {
        name: "description",
        content:
          "Search and filter platform accounts, open a user's detail record, and record audited role changes.",
      },
      { property: "og:title", content: "Users — Medora Admin workspace" },
      {
        property: "og:description",
        content:
          "Administrator view of platform accounts, statuses and role grants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

const statusTone = {
  active: "positive",
  pending: "warning",
  suspended: "danger",
} as const;

const roleLabel = {
  patient: "Patient",
  pharmacy: "Pharmacy",
  doctor: "Doctor",
  admin: "Admin",
} as const;

const roles = Object.keys(roleLabel) as (keyof typeof roleLabel)[];

interface RoleChangeEntry {
  id: string;
  userId: string;
  userName: string;
  from: string;
  to: string;
  at: string;
}

function UsersPage() {
  const users = useWorkspaceData("platformUsers");
  const [openId, setOpenId] = useState<string | null>(null);
  const [roleOverrides, setRoleOverrides] = useState<
    Record<string, PlatformUser["role"]>
  >({});
  const [auditLog, setAuditLog] = useState<RoleChangeEntry[]>([]);

  const rows = users.data ?? [];
  const selected = rows.find((u) => u.id === openId) ?? null;
  const selectedRole: PlatformUser["role"] = selected
    ? (roleOverrides[selected.id] ?? selected.role)
    : "patient";

  const columns: DataColumn<PlatformUser>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      hideBelow: "sm",
      sortValue: (r) => r.role,
      render: (r) => roleLabel[roleOverrides[r.id] ?? r.role],
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => (
        <StatusPill
          label={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
          tone={statusTone[r.status]}
        />
      ),
    },
    {
      key: "joined",
      header: "Joined",
      hideBelow: "md",
      sortValue: (r) => r.joined,
      render: (r) => shortDate(`${r.joined}T00:00:00.000Z`),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        demo
        description="Every account shown here is a sample record. Role and status changes are recorded in this session's audit trail, not applied to a live directory."
      />

      <WorkspaceSection
        title="Platform accounts"
        description="Search by name or email, filter by role and status, and open a record to review or change it."
      >
        <AsyncSection
          query={users}
          emptyIcon={Users}
          emptyTitle="No users found"
          emptyDescription="Platform accounts will appear here once loaded."
          isEmpty={(d) => d.length === 0}
        >
          {(data) => (
            <DataTable
              rows={data}
              columns={columns}
              getId={(r) => r.id}
              searchText={(r) => `${r.name} ${r.email}`}
              searchPlaceholder="Search by name or email…"
              initialSort={{ key: "name", direction: "asc" }}
              pageSize={8}
              filters={[
                {
                  key: "role",
                  label: "Role",
                  options: roles.map((value) => ({
                    value,
                    label: roleLabel[value],
                  })),
                  predicate: (r, v) => (roleOverrides[r.id] ?? r.role) === v,
                },
                {
                  key: "status",
                  label: "Status",
                  options: [
                    { value: "active", label: "Active" },
                    { value: "pending", label: "Pending" },
                    { value: "suspended", label: "Suspended" },
                  ],
                  predicate: (r, v) => r.status === v,
                },
              ]}
              onRowClick={(r) => setOpenId(r.id)}
              rowActions={(r) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenId(r.id)}
                >
                  Open
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
                <DialogDescription>{selected.email}</DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Joined
                  </dt>
                  <dd className="mt-0.5">
                    {shortDate(`${selected.joined}T00:00:00.000Z`)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Last active
                  </dt>
                  <dd className="mt-0.5">
                    {shortDate(`${selected.lastActive}T00:00:00.000Z`)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </dt>
                  <dd className="mt-0.5">
                    <StatusPill
                      label={
                        selected.status.charAt(0).toUpperCase() +
                        selected.status.slice(1)
                      }
                      tone={statusTone[selected.status]}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Two-factor authentication
                  </dt>
                  <dd className="mt-0.5">
                    {selected.mfa ? "Enabled" : "Not enabled"}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 rounded-md border border-border p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-ink">
                  <ShieldCheck className="size-4" aria-hidden /> Role
                </p>
                <p className="text-xs text-muted-foreground">
                  Granting the administrator role is a privileged, audited
                  action. Recording it here attributes the change to your
                  administrator session for this demo.
                </p>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => {
                    const nextRole = value as PlatformUser["role"];
                    if (
                      !selected ||
                      nextRole === (roleOverrides[selected.id] ?? selected.role)
                    )
                      return;
                    const fromRole =
                      roleOverrides[selected.id] ?? selected.role;
                    setRoleOverrides((prev) => ({
                      ...prev,
                      [selected.id]: nextRole,
                    }));
                    setAuditLog((prev) => [
                      {
                        id: `rc-${Date.now()}`,
                        userId: selected.id,
                        userName: selected.name,
                        from: roleLabel[fromRole],
                        to: roleLabel[nextRole],
                        at: new Date().toISOString(),
                      },
                      ...prev,
                    ]);
                    toast.success(
                      `Recorded: ${selected.name} moved from ${roleLabel[fromRole]} to ${roleLabel[nextRole]} (audited, this session)`,
                    );
                  }}
                >
                  <SelectTrigger aria-label="Change role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((value) => (
                      <SelectItem key={value} value={value}>
                        {roleLabel[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenId(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <WorkspaceSection
        title="Role change audit trail"
        description="Every role grant recorded in this session, attributable to the administrator who made it."
      >
        <Timeline
          items={auditLog.map((entry) => ({
            id: entry.id,
            at: shortDateTime(entry.at),
            title: `${entry.userName}: ${entry.from} → ${entry.to}`,
            meta: "You (this session)",
          }))}
        />
      </WorkspaceSection>
    </div>
  );
}
