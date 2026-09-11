import { createFileRoute } from "@tanstack/react-router";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  Filter,
  MessageSquareWarning,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { PageHeader, StatTile } from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import {
  AsyncSection,
  StatusPill,
  WorkspaceSection,
} from "@/components/workspace/parts";
import {
  shortDate,
  shortDateTime,
  useWorkspaceData,
} from "@/services/workspace";
import type { ModerationReport } from "@/data/workspace-demo";

export const Route = createFileRoute("/admin/moderation")({
  head: () => ({
    meta: [
      { title: "Safety & Moderation Queue — Medora Admin Workspace" },
      {
        name: "description",
        content:
          "Content and clinical safety moderation queue, user complaint reviews, safety flags, and regulatory enforcement ledger.",
      },
      { property: "og:title", content: "Moderation — Medora Admin Workspace" },
      {
        property: "og:description",
        content:
          "Platform moderation, safety escalation reviews, and compliance enforcement.",
      },
    ],
  }),
  component: AdminModerationPage,
});

const statusMeta = {
  open: { label: "Open", tone: "danger" as const },
  investigating: { label: "Investigating", tone: "warning" as const },
  actioned: { label: "Actioned / Resolved", tone: "positive" as const },
  dismissed: { label: "Dismissed", tone: "neutral" as const },
};

const severityMeta = {
  high: {
    label: "High Risk",
    cls: "bg-destructive-soft text-destructive border-destructive/40",
  },
  medium: {
    label: "Medium",
    cls: "bg-warning-soft text-warning-foreground border-warning/40",
  },
  low: {
    label: "Low",
    cls: "bg-secondary text-muted-foreground border-border",
  },
};

export function AdminModerationPage() {
  const moderationQuery = useWorkspaceData("moderation");
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(
    null,
  );
  const [resolutionNote, setResolutionNote] = useState("");

  // Sync initial loaded reports
  useMemo(() => {
    if (moderationQuery.data && reports.length === 0) {
      setReports(moderationQuery.data);
    }
  }, [moderationQuery.data, reports.length]);

  const updateStatus = (
    id: string,
    newStatus: ModerationReport["status"],
    note?: string,
  ) => {
    setReports((prev) =>
      prev.map((rep) => (rep.id === id ? { ...rep, status: newStatus } : rep)),
    );
    toast.success(`Report #${id} marked as ${statusMeta[newStatus].label}`, {
      description: note ? `Note: "${note}"` : undefined,
    });
    if (selectedReport?.id === id) {
      setSelectedReport((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    }
    setResolutionNote("");
  };

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const matchStatus = filterStatus === "all" || rep.status === filterStatus;
      const matchSeverity =
        filterSeverity === "all" || rep.severity === filterSeverity;
      const matchQuery =
        !searchQuery.trim() ||
        rep.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.surface.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSeverity && matchQuery;
    });
  }, [reports, filterStatus, filterSeverity, searchQuery]);

  const totalReports = reports.length;
  const openReports = reports.filter((r) => r.status === "open").length;
  const investigatingReports = reports.filter(
    (r) => r.status === "investigating",
  ).length;
  const resolvedReports = reports.filter((r) => r.status === "actioned").length;

  const columns: DataColumn<ModerationReport>[] = [
    {
      key: "target",
      header: "Target / Entity",
      sortValue: (r) => r.target,
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.target}</p>
          <p className="text-xs text-muted-foreground capitalize">
            Surface: {r.surface}
          </p>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reported Reason",
      sortValue: (r) => r.reason,
      render: (r) => <span className="text-sm text-ink">{r.reason}</span>,
    },
    {
      key: "severity",
      header: "Severity",
      sortValue: (r) => r.severity,
      render: (r) => {
        const meta = severityMeta[r.severity];
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${meta.cls}`}
          >
            {r.severity === "high" && <AlertOctagon className="size-3" />}
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "reporter",
      header: "Reporter",
      hideBelow: "md",
      sortValue: (r) => r.reporter,
      render: (r) => (
        <span className="text-xs text-muted-foreground">{r.reporter}</span>
      ),
    },
    {
      key: "at",
      header: "Timestamp",
      hideBelow: "lg",
      sortValue: (r) => r.at,
      render: (r) => (
        <div>
          <p className="text-xs text-ink">{shortDate(r.at)}</p>
          <p className="text-[10px] text-muted-foreground">
            {shortDateTime(r.at)}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => {
        const meta = statusMeta[r.status];
        return <StatusPill label={meta.label} tone={meta.tone} />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => updateStatus(r.id, "investigating")}
            >
              Investigate
            </Button>
          )}
          {r.status === "investigating" && (
            <Button
              size="sm"
              className="h-7 text-xs bg-primary text-primary-foreground"
              onClick={() => updateStatus(r.id, "actioned")}
            >
              Action & Resolve
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setSelectedReport(r)}
          >
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content & Clinical Moderation"
        demo
        description="Review safety flags, unverified medicine claims, incorrect pricing reports, and clinical advice policy violations."
      />

      {/* KPI Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total Reports"
          value={totalReports.toString()}
          hint="Historical moderation tickets"
        />
        <StatTile
          label="Open Safety Flags"
          value={openReports.toString()}
          hint="Requires immediate triage"
        />
        <StatTile
          label="Under Investigation"
          value={investigatingReports.toString()}
          hint="Active compliance reviews"
        />
        <StatTile
          label="Enforced & Resolved"
          value={resolvedReports.toString()}
          hint="Sanctions or corrections applied"
        />
      </div>

      {/* Main Moderation Table */}
      <WorkspaceSection
        title="Moderation Ticket Ledger"
        description="Filter reports by platform surface, severity tier, or current resolution lifecycle."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search target, reason, surface..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="actioned">Actioned / Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <AsyncSection
          query={moderationQuery}
          emptyIcon={ShieldAlert}
          emptyTitle="No moderation reports found"
          emptyDescription="The platform safety queue is clean. New flags will appear here."
          isEmpty={() => filteredReports.length === 0}
        >
          {() => (
            <DataTable<ModerationReport>
              rows={filteredReports}
              columns={columns}
              getId={(r) => r.id}
              searchText={(r) =>
                `${r.id} ${r.reporter} ${r.target} ${r.reason} ${r.surface}`
              }
              searchPlaceholder="Search ticket ID, reporter, target or reason…"
              onRowClick={(r) => setSelectedReport(r)}
            />
          )}
        </AsyncSection>
      </WorkspaceSection>

      {/* Moderation Detail & Action Dialog */}
      <Dialog
        open={Boolean(selectedReport)}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        {selectedReport && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Moderation Ticket #{selectedReport.id}
              </DialogTitle>
              <DialogDescription>
                Filed by{" "}
                <span className="font-medium text-ink">
                  {selectedReport.reporter}
                </span>{" "}
                on {shortDateTime(selectedReport.at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Target Entity:</span>
                  <span className="font-semibold text-ink">
                    {selectedReport.target}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Surface:</span>
                  <Badge variant="outline" className="capitalize">
                    {selectedReport.surface}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk Severity:</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${severityMeta[selectedReport.severity].cls}`}
                  >
                    {severityMeta[selectedReport.severity].label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <StatusPill
                    label={statusMeta[selectedReport.status].label}
                    tone={statusMeta[selectedReport.status].tone}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Violation & Reason Details
                </Label>
                <div className="mt-1 rounded-md border border-border bg-muted/40 p-3 text-ink leading-relaxed">
                  {selectedReport.reason}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="resolutionNote"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Administrator Enforcement Note / Audit Memo
                </Label>
                <Textarea
                  id="resolutionNote"
                  placeholder="Record policy action, catalog update, or rationale for dismissing..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-wrap items-center justify-between gap-2 sm:justify-between">
              <div className="flex items-center gap-2">
                {selectedReport.status !== "dismissed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      updateStatus(
                        selectedReport.id,
                        "dismissed",
                        resolutionNote,
                      )
                    }
                  >
                    <XCircle className="size-4 mr-1" /> Dismiss Ticket
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedReport.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateStatus(
                        selectedReport.id,
                        "investigating",
                        resolutionNote,
                      )
                    }
                  >
                    Mark Investigating
                  </Button>
                )}
                {selectedReport.status !== "actioned" && (
                  <Button
                    size="sm"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() =>
                      updateStatus(
                        selectedReport.id,
                        "actioned",
                        resolutionNote ||
                          "Sanction or content removal enforced.",
                      )
                    }
                  >
                    <FileCheck className="size-4 mr-1" /> Enforce & Resolve
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
