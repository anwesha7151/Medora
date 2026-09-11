import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgeAlert,
  Bot,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  HelpCircle,
  IndianRupee,
  Info,
  Maximize2,
  PenTool,
  Pill,
  Scan,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  UserCheck,
  XCircle,
  ZoomIn,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PageHeader,
  SafetyNotice,
  StatTile,
} from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import {
  AiAssistTag,
  AsyncSection,
  StatusPill,
  WorkspaceSection,
} from "@/components/workspace/parts";
import { shortDateTime, useWorkspaceData } from "@/services/workspace";
import type { VerificationQueueRow } from "@/data/workspace-demo";

export const Route = createFileRoute("/pharmacy/prescriptions")({
  head: () => ({
    meta: [
      { title: "Pharmacist Verification Queue — Medora" },
      {
        name: "description",
        content:
          "Digital pharmacist verification queue for uploaded prescriptions with OCR vision inspection, CDSCO Schedule H checks, and digital sign-off.",
      },
      {
        property: "og:title",
        content: "Pharmacist Verification Queue — Medora",
      },
    ],
  }),
  component: VerificationQueuePage,
});

const statusMeta = {
  waiting: { label: "Waiting Review", tone: "warning" },
  in_review: { label: "In Review", tone: "info" },
  approved: { label: "Pharmacist Approved", tone: "positive" },
  rejected: { label: "Rejected / Incomplete", tone: "danger" },
} as const;

function confidenceTone(confidence: number): "positive" | "warning" | "danger" {
  if (confidence >= 0.85) return "positive";
  if (confidence >= 0.65) return "warning";
  return "danger";
}

const PRESET_APPROVAL_REASONS = [
  "Verified against NMC registry. Dosage within therapeutic window.",
  "Schedule H entry recorded. Patient allergy profile cross-checked.",
  "Repeat therapy verified with clinic record. Directions confirmed.",
];

const PRESET_REJECTION_REASONS = [
  "Prescriber registration seal unreadable / unconfirmed on NMC.",
  "Schedule H1 restricted line requires direct clinical consultation.",
  "Prescription expired (>6 months from issue date).",
];

function VerificationQueuePage() {
  const queue = useWorkspaceData("verificationQueue");
  const [openId, setOpenId] = useState<string | null>("vq-1");
  const [localState, setLocalState] = useState<
    Record<
      string,
      { status: "approved" | "rejected"; reason: string; signedAt: string }
    >
  >({});
  const [reason, setReason] = useState("");
  const [checklist, setChecklist] = useState<{
    prescriberNmc: boolean;
    dosageConfirmed: boolean;
    ddiClear: boolean;
  }>({
    prescriberNmc: true,
    dosageConfirmed: true,
    ddiClear: true,
  });

  const rows = queue.data ?? [];
  const open = useMemo(
    () => rows.find((r) => r.id === openId) ?? rows[0] ?? null,
    [rows, openId],
  );

  const pendingCount = rows.filter((r) => {
    const st = localState[r.id]?.status ?? r.status;
    return st === "waiting" || st === "in_review";
  }).length;

  const approvedCount = rows.filter((r) => {
    const st = localState[r.id]?.status ?? r.status;
    return st === "approved";
  }).length;

  const columns: DataColumn<VerificationQueueRow>[] = [
    {
      key: "patient",
      header: "Patient / Prescriber",
      sortValue: (r) => r.patient,
      render: (r) => (
        <div>
          <p className="font-bold text-ink flex items-center gap-1.5">
            <User className="size-3.5 text-primary" />
            {r.patient}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {r.prescriber}
          </p>
        </div>
      ),
    },
    {
      key: "prescriptionId",
      header: "Rx ID",
      hideBelow: "md",
      sortValue: (r) => r.prescriptionId,
      render: (r) => (
        <Badge
          variant="outline"
          className="font-mono text-xs bg-muted/50 border-border"
        >
          {r.prescriptionId}
        </Badge>
      ),
    },
    {
      key: "received",
      header: "Received",
      hideBelow: "sm",
      sortValue: (r) => r.receivedAt,
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {shortDateTime(r.receivedAt)}
        </span>
      ),
    },
    {
      key: "items",
      header: "Lines",
      hideBelow: "lg",
      align: "right",
      sortValue: (r) => r.items,
      render: (r) => (
        <span className="font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {r.items} {r.items === 1 ? "line" : "lines"}
        </span>
      ),
    },
    {
      key: "confidence",
      header: "AI Vision OCR",
      hideBelow: "md",
      sortValue: (r) => r.confidence,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <StatusPill
            label={`${Math.round(r.confidence * 100)}%`}
            tone={confidenceTone(r.confidence)}
          />
        </div>
      ),
    },
    {
      key: "status",
      header: "Decision Status",
      sortValue: (r) => localState[r.id]?.status ?? r.status,
      render: (r) => {
        const state = localState[r.id]?.status ?? r.status;
        return <StatusPill {...statusMeta[state]} />;
      },
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Pharmacist Verification Queue"
        demo
        description="Review digital prescription uploads, verify National Medical Commission (NMC) practitioner seals, and record binding dispensing approvals."
      />

      {/* Top Verification Telemetry KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Pending Verification"
          value={String(pendingCount)}
          icon={Clock}
          tone={pendingCount > 0 ? "attention" : "default"}
          hint="Prescriptions awaiting pharmacist sign-off"
        />
        <StatTile
          label="Verified Today"
          value={String(approvedCount + 14)}
          icon={FileCheck2}
          tone="positive"
          hint="100% CDSCO Schedule Compliant"
        />
        <StatTile
          label="Avg OCR Extraction Confidence"
          value="94.6%"
          icon={Scan}
          hint="Optical character recognition fidelity"
        />
        <StatTile
          label="Restricted Schedule H1 Lines"
          value="2 Lines"
          icon={ShieldAlert}
          tone="attention"
          hint="Antimicrobial stewardship monitoring"
        />
      </div>

      <SafetyNotice
        tone="warning"
        title="Registered Pharmacist Statutory Responsibility (CDSCO & Pharmacy Act 1948)"
      >
        AI vision text extraction and confidence metrics are purely assistive
        tools. Under Indian Pharmacy Regulations, every medicine formulation,
        dosage frequency, and prescriber registration must be confirmed by a
        licensed Registered Pharmacist before dispensing.
      </SafetyNotice>

      {/* Main Two-Column Verification Workspace */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.25fr)]">
        {/* Left Column: Queue Table */}
        <WorkspaceSection
          title="Prescription Inflow Queue"
          description="Select any submitted prescription to inspect OCR lines and record your clinical decision."
        >
          <AsyncSection
            query={queue}
            emptyIcon={FileSearch}
            emptyTitle="Queue is clear"
            emptyDescription="New prescription submissions will automatically appear here."
            isEmpty={(d) => d.length === 0}
          >
            {(data) => (
              <DataTable
                rows={data}
                columns={columns}
                getId={(r) => r.id}
                searchText={(r) =>
                  `${r.patient} ${r.prescriber} ${r.prescriptionId}`
                }
                searchPlaceholder="Search by patient, prescriber, or Rx ID…"
                initialSort={{ key: "received", direction: "desc" }}
                pageSize={6}
                onRowClick={(r) => {
                  setOpenId(r.id);
                  setReason("");
                }}
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    options: Object.entries(statusMeta).map(
                      ([value, meta]) => ({
                        value,
                        label: meta.label,
                      }),
                    ),
                    predicate: (r, v) =>
                      (localState[r.id]?.status ?? r.status) === v,
                  },
                ]}
                rowActions={(r) => (
                  <Button
                    variant={open?.id === r.id ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs font-bold gap-1 rounded-xl"
                    onClick={() => {
                      setOpenId(r.id);
                      setReason("");
                    }}
                  >
                    <Eye className="size-3" />
                    Review
                  </Button>
                )}
              />
            )}
          </AsyncSection>
        </WorkspaceSection>

        {/* Right Column: High-Tech Prescription Verification & Sign-off Panel */}
        <div className="space-y-6">
          {open ? (
            <div className="surface rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-lift space-y-6">
              {/* Header & Meta */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-primary/20 text-primary">
                      <Stethoscope className="size-4.5" />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-extrabold text-ink flex items-center gap-2">
                        Prescription {open.prescriptionId}
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono bg-primary/10 text-primary border-primary/30"
                        >
                          Verified Format
                        </Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {shortDateTime(open.receivedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <StatusPill
                  {...statusMeta[localState[open.id]?.status ?? open.status]}
                />
              </div>

              {/* Patient & Prescriber Quick Profile */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                    <User className="size-3 text-primary" /> Patient Details
                  </span>
                  <p className="font-extrabold text-sm text-ink">
                    {open.patient}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Indiranagar, Bengaluru · Age: 29
                  </p>
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-500/20">
                      Allergy: Penicillin
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                    <UserCheck className="size-3 text-emerald-600" />{" "}
                    Prescribing Clinician
                  </span>
                  <p className="font-extrabold text-sm text-ink">
                    {open.prescriber}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Apollo Clinic & Diagnostics
                  </p>
                  <div className="pt-1 flex items-center gap-1">
                    <ShieldCheck className="size-3 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-600">
                      NMC Reg Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulated High-Res Prescription Viewfinder */}
              <div className="rounded-xl border border-border bg-slate-950 p-4 text-slate-100 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono text-[11px]">
                    <Scan className="size-3.5" /> High-Res Optical Scan (OCR
                    Stream)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Fidelity: {Math.round(open.confidence * 100)}%
                  </span>
                </div>

                <div className="font-mono text-xs space-y-2 py-1 text-slate-200">
                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-teal-300 font-bold">
                      <span>
                        1. Rx: Augmentin 625 Duo (Amoxicillin + Clavulanic Acid
                        625mg)
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] border-amber-500/40 bg-amber-500/10 text-amber-300"
                      >
                        Schedule H1
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Sig: 1 Tab BD after meals x 5 days (Total 10 Tabs)
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-teal-300 font-bold">
                      <span>
                        2. Rx: Levocet 5mg (Levocetirizine Dihydrochloride)
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      >
                        Schedule H
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Sig: 1 Tab OD at bedtime x 10 days (Total 10 Tabs)
                    </p>
                  </div>
                </div>

                {open.note && (
                  <div className="rounded bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>OCR Vision Note: {open.note}</span>
                  </div>
                )}
              </div>

              {/* Pharmacist Verification Checklist */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5">
                <h4 className="font-bold text-xs text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="size-3.5 text-primary" />
                  Pharmacist Pre-Dispensing Verification Checklist
                </h4>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-foreground">
                    <input
                      type="checkbox"
                      checked={checklist.prescriberNmc}
                      onChange={(e) =>
                        setChecklist({
                          ...checklist,
                          prescriberNmc: e.target.checked,
                        })
                      }
                      className="rounded border-border text-primary focus:ring-primary size-4"
                    />
                    <span>
                      Prescriber Registration Number validated on National
                      Medical Commission registry
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-foreground">
                    <input
                      type="checkbox"
                      checked={checklist.dosageConfirmed}
                      onChange={(e) =>
                        setChecklist({
                          ...checklist,
                          dosageConfirmed: e.target.checked,
                        })
                      }
                      className="rounded border-border text-primary focus:ring-primary size-4"
                    />
                    <span>
                      Medicine strength, dosage frequency, and duration
                      clinically verified
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-foreground">
                    <input
                      type="checkbox"
                      checked={checklist.ddiClear}
                      onChange={(e) =>
                        setChecklist({
                          ...checklist,
                          ddiClear: e.target.checked,
                        })
                      }
                      className="rounded border-border text-primary focus:ring-primary size-4"
                    />
                    <span>
                      No severe drug-drug interactions or cross-allergies
                      detected
                    </span>
                  </label>
                </div>
              </div>

              {/* Decision Log & Reason Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="verify-reason"
                    className="font-bold text-xs text-ink"
                  >
                    Pharmacist Clinical Decision Record
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Recorded with digital timestamp
                  </span>
                </div>

                <Textarea
                  id="verify-reason"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Type or click a preset clinical reason below…"
                  className="text-xs rounded-xl bg-background"
                />

                {/* Preset Fast-Pick Reasons */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_APPROVAL_REASONS.map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setReason(pr)}
                      className="rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 px-2.5 py-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors text-left"
                    >
                      + {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Binding Pharmacist Actions */}
              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    disabled={
                      !checklist.prescriberNmc || !checklist.dosageConfirmed
                    }
                    onClick={() => {
                      const finalReason =
                        reason.trim() ||
                        "Prescription verified against NMC database and CDSCO schedule.";
                      setLocalState((prev) => ({
                        ...prev,
                        [open.id]: {
                          status: "approved",
                          reason: finalReason,
                          signedAt: new Date().toISOString(),
                        },
                      }));
                      toast.success(
                        `Prescription ${open.prescriptionId} Digitally Signed & Approved`,
                      );
                      setReason("");
                    }}
                    className="h-9 px-4 font-bold text-xs gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft"
                  >
                    <CheckCircle2 className="size-4" /> Digitally Sign & Approve
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const finalReason =
                        reason.trim() ||
                        "Prescription incomplete or signature verification unconfirmed.";
                      setLocalState((prev) => ({
                        ...prev,
                        [open.id]: {
                          status: "rejected",
                          reason: finalReason,
                          signedAt: new Date().toISOString(),
                        },
                      }));
                      toast.error(
                        `Prescription ${open.prescriptionId} Marked Rejected`,
                      );
                      setReason("");
                    }}
                    className="h-9 px-4 font-bold text-xs gap-1.5 rounded-xl border-destructive/40 text-destructive hover:bg-destructive-soft"
                  >
                    <XCircle className="size-4" /> Reject Prescription
                  </Button>
                </div>

                <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                  <PenTool className="size-3 text-primary" />
                  Pharmacist License: KA-PH-2024-REG
                </span>
              </div>
            </div>
          ) : (
            <WorkspaceSection
              title="Prescription Details"
              description="Select any prescription from the queue on the left to inspect lines."
            >
              <div className="py-12 text-center text-muted-foreground text-xs">
                No prescription selected. Select an item to begin verification.
              </div>
            </WorkspaceSection>
          )}
        </div>
      </div>
    </div>
  );
}
