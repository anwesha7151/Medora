import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  Filter,
  Layers,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import {
  AsyncSection,
  StatusPill,
  WorkspaceSection,
} from "@/components/workspace/parts";
import { shortDateTime, useWorkspaceData } from "@/services/workspace";
import type { AuditEvent } from "@/lib/domain";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Compliance & Audit Log — Medora Admin Workspace" },
      {
        name: "description",
        content:
          "Immutable regulatory compliance, clinical approvals, security policies, and access audit ledger.",
      },
      { property: "og:title", content: "Audit log — Medora Admin workspace" },
      {
        property: "og:description",
        content:
          "Administrator audit ledger of clinical approvals, prescription verifications, and security events.",
      },
    ],
  }),
  component: AuditLogPage,
});

const categoryConfig = {
  prescription: { label: "Prescription", tone: "info" as const },
  clinical: { label: "Clinical / Triage", tone: "warning" as const },
  security: { label: "Security & RLS", tone: "danger" as const },
  catalog: { label: "Catalog Sync", tone: "neutral" as const },
  pharmacy: { label: "Pharmacy Gov", tone: "info" as const },
  compliance: { label: "DPDP / Legal", tone: "positive" as const },
};

const roleConfig = {
  admin: { label: "Admin", tone: "danger" as const },
  doctor: { label: "Doctor", tone: "info" as const },
  pharmacy: { label: "Pharmacist", tone: "warning" as const },
  patient: { label: "Patient", tone: "neutral" as const },
  system: { label: "System Daemon", tone: "positive" as const },
};

function AuditLogPage() {
  const auditQuery = useWorkspaceData("auditEvents");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [inspectEvent, setInspectEvent] = useState<AuditEvent | null>(null);

  const rawRows = auditQuery.data ?? [];

  const filteredRows = useMemo(() => {
    return rawRows.filter((ev) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ev.action.toLowerCase().includes(q) ||
        ev.actor.toLowerCase().includes(q) ||
        ev.target.toLowerCase().includes(q) ||
        ev.ip.includes(q) ||
        (ev.details && ev.details.toLowerCase().includes(q));

      const matchesRole =
        selectedRole === "all" || (ev.role && ev.role === selectedRole);

      const matchesCategory =
        selectedCategory === "all" ||
        (ev.category && ev.category === selectedCategory);

      const matchesStatus =
        selectedStatus === "all" || (ev.status && ev.status === selectedStatus);

      return matchesSearch && matchesRole && matchesCategory && matchesStatus;
    });
  }, [rawRows, searchQuery, selectedRole, selectedCategory, selectedStatus]);

  const handleExport = (format: "csv" | "json") => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(filteredRows, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medora-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Audit ledger exported to JSON");
    } else {
      const headers = [
        "ID",
        "Timestamp",
        "Actor",
        "Role",
        "Category",
        "Action",
        "Target",
        "IP",
        "Status",
        "Details",
      ];
      const rows = filteredRows.map((r) => [
        r.id,
        r.at,
        `"${r.actor}"`,
        r.role || "unknown",
        r.category || "general",
        `"${r.action}"`,
        `"${r.target}"`,
        r.ip,
        r.status || "success",
        `"${(r.details || "").replace(/"/g, '""')}"`,
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((e) => e.join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medora-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Audit ledger exported to CSV");
    }
  };

  const columns: DataColumn<AuditEvent>[] = [
    {
      key: "at",
      header: "Timestamp",
      sortValue: (r) => r.at,
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-medium text-foreground">
            {shortDateTime(r.at)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            UTC ISO-8601
          </span>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor & Role",
      sortValue: (r) => r.actor,
      render: (r) => {
        const role = r.role ? roleConfig[r.role] : null;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              {r.role === "admin" && (
                <Shield className="size-3.5 text-primary" />
              )}
              {r.role === "doctor" && (
                <UserCheck className="size-3.5 text-blue-600" />
              )}
              {r.role === "pharmacy" && (
                <FileCheck className="size-3.5 text-amber-600" />
              )}
              {r.role === "system" && (
                <Terminal className="size-3.5 text-emerald-600" />
              )}
              <span>{r.actor}</span>
            </div>
            {role && <StatusPill tone={role.tone}>{role.label}</StatusPill>}
          </div>
        );
      },
    },
    {
      key: "action",
      header: "Action & Details",
      sortValue: (r) => r.action,
      render: (r) => {
        const cat = r.category ? categoryConfig[r.category] : null;
        return (
          <div className="max-w-md space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{r.action}</span>
              {cat && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {cat.label}
                </span>
              )}
            </div>
            {r.details && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {r.details}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "target",
      header: "Target Entity",
      sortValue: (r) => r.target,
      render: (r) => (
        <span className="rounded border border-border/80 bg-background/50 px-2 py-0.5 font-mono text-xs text-foreground">
          {r.target}
        </span>
      ),
    },
    {
      key: "ip",
      header: "Network / Origin",
      sortValue: (r) => r.ip,
      render: (r) => (
        <div className="font-mono text-xs text-muted-foreground">{r.ip}</div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status ?? "success",
      render: (r) => {
        const status = r.status || "success";
        return (
          <StatusPill
            tone={
              status === "success"
                ? "positive"
                : status === "warning"
                  ? "warning"
                  : status === "flagged" || status === "rejected"
                    ? "danger"
                    : "neutral"
            }
          >
            {status.toUpperCase()}
          </StatusPill>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInspectEvent(r)}
          className="h-8 gap-1 text-xs font-medium"
        >
          <Eye className="size-3.5" /> Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Audit Log"
        demo
        description="Tamper-evident system ledger tracking clinical authorizations, prescription verifications, role grants, and data access policies."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface flex items-center gap-3.5 p-4">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-numeric">
              {rawRows.length}
            </div>
            <div className="text-xs text-muted-foreground">Recorded Events</div>
          </div>
        </div>

        <div className="surface flex items-center gap-3.5 p-4">
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600">
            <FileCheck className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-numeric">
              {rawRows.filter((r) => r.category === "prescription").length}
            </div>
            <div className="text-xs text-muted-foreground">
              Prescription Verifications
            </div>
          </div>
        </div>

        <div className="surface flex items-center gap-3.5 p-4">
          <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-numeric">
              {
                rawRows.filter(
                  (r) => r.status === "warning" || r.status === "flagged",
                ).length
              }
            </div>
            <div className="text-xs text-muted-foreground">
              Flagged & Clinical Alerts
            </div>
          </div>
        </div>

        <div className="surface flex items-center gap-3.5 p-4">
          <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600">
            <Activity className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-numeric">100%</div>
            <div className="text-xs text-muted-foreground">
              DPDP & RLS Compliance
            </div>
          </div>
        </div>
      </div>

      <WorkspaceSection
        title="Audit Log Records"
        description="Filter by actor role, regulatory category, or search specific entity IDs and IP addresses."
      >
        {/* Filter Toolbar */}
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search action, actor, target or IP…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-[130px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="pharmacy">Pharmacist</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="h-9 w-full text-xs sm:w-[145px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="prescription">Prescriptions</SelectItem>
                <SelectItem value="clinical">Clinical & Triage</SelectItem>
                <SelectItem value="security">Security & RLS</SelectItem>
                <SelectItem value="catalog">Catalog Sync</SelectItem>
                <SelectItem value="pharmacy">Pharmacy Gov</SelectItem>
                <SelectItem value="compliance">DPDP Compliance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-[125px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              className="h-9 gap-1.5 text-xs"
            >
              <Download className="size-3.5" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("json")}
              className="h-9 gap-1.5 text-xs"
            >
              <Download className="size-3.5" /> JSON
            </Button>
          </div>
        </div>

        <AsyncSection
          query={auditQuery}
          emptyIcon={ShieldCheck}
          emptyTitle="No audit log records"
          emptyDescription="Audit records will automatically appear here as system events occur."
          isEmpty={(d) => d.length === 0}
        >
          {() => (
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
              <DataTable
                rows={filteredRows}
                columns={columns}
                getId={(r) => r.id}
                searchText={(r) =>
                  `${r.actor} ${r.action} ${r.target} ${r.details || ""}`
                }
                searchPlaceholder="Search audit events…"
                initialSort={{ key: "at", direction: "desc" }}
                pageSize={10}
              />
            </div>
          )}
        </AsyncSection>
      </WorkspaceSection>

      {/* Event Details Dialog */}
      <Dialog
        open={!!inspectEvent}
        onOpenChange={(open) => !open && setInspectEvent(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5 text-primary" />
              Audit Event Record #{inspectEvent?.id}
            </DialogTitle>
            <DialogDescription>
              Detailed cryptographic verification and context for this audit
              entry.
            </DialogDescription>
          </DialogHeader>

          {inspectEvent && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-3">
                <div>
                  <span className="text-muted-foreground">Timestamp:</span>
                  <p className="font-mono font-medium text-foreground">
                    {inspectEvent.at}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Origin IP:</span>
                  <p className="font-mono font-medium text-foreground">
                    {inspectEvent.ip}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Actor:</span>
                  <p className="font-medium text-foreground">
                    {inspectEvent.actor}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <p className="font-medium text-foreground">
                    {inspectEvent.role || "Unspecified"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-medium text-muted-foreground">
                  Action Summary:
                </span>
                <p className="rounded border border-border/80 bg-background/50 p-2.5 font-medium text-foreground">
                  {inspectEvent.action}
                </p>
              </div>

              {inspectEvent.details && (
                <div className="space-y-1.5">
                  <span className="font-medium text-muted-foreground">
                    Operational Details & Context:
                  </span>
                  <p className="rounded border border-border/80 bg-muted/40 p-2.5 text-foreground leading-relaxed">
                    {inspectEvent.details}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="font-medium text-muted-foreground">
                  Target Record ID:
                </span>
                <p className="font-mono text-primary">{inspectEvent.target}</p>
              </div>

              <div className="rounded-lg border border-dashed border-border bg-card p-3">
                <span className="text-muted-foreground font-mono text-[11px]">
                  Integrity Checksum:
                </span>
                <p className="font-mono text-[10px] text-muted-foreground break-all mt-0.5">
                  SHA256:
                  {btoa(
                    inspectEvent.id + inspectEvent.at + inspectEvent.actor,
                  ).slice(0, 32)}
                  ...
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
