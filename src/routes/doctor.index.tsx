import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  ClipboardCheck,
  FileEdit,
  HeartPulse,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, StatTile } from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import {
  AiAssistNotice,
  AsyncSection,
  StatusPill,
  Timeline,
  WorkspaceSection,
} from "@/components/workspace/parts";
import { PatientSearchBar } from "@/components/patient/PatientSearchBar";
import { WeeklyWorkflowChart } from "@/components/workspace/WeeklyWorkflowChart";
import { ClinicalNotesForm } from "@/components/doctor/ClinicalNotesForm";
import { PatientHealthMetricsDashboard } from "@/components/patient/PatientHealthMetricsDashboard";
import {
  shortDate,
  shortDateTime,
  timeOnly,
  useWorkspaceData,
} from "@/services/workspace";
import type { DoctorPatient } from "@/lib/domain";

export const Route = createFileRoute("/doctor/")({
  head: () => ({
    meta: [
      { title: "Patient overview — Medora clinician workspace" },
      {
        name: "description",
        content:
          "Clinician view of patient records, assistive summaries, allergies, current medicines, weekly workflow volume, and recorded clinical decisions.",
      },
      {
        property: "og:title",
        content: "Patient overview — Medora clinician workspace",
      },
      {
        property: "og:description",
        content:
          "Patient list, assistive summaries, weekly telemetry, and clinician-recorded decisions in Medora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorPatientsPage,
});

const statusTone = {
  waiting: "warning",
  in_consult: "info",
  review: "neutral",
  closed: "positive",
} as const;

const statusLabel = {
  waiting: "Waiting",
  in_consult: "In consult",
  review: "Needs review",
  closed: "Closed",
} as const;

function DoctorPatientsPage() {
  const patients = useWorkspaceData("doctorPatients");
  const appointments = useWorkspaceData("appointments");
  const notes = useWorkspaceData("consultNotes");
  const history = useWorkspaceData("medicineHistory");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "records" | "vitals" | "chart" | "notes"
  >("records");
  const [decision, setDecision] = useState("");
  const [recorded, setRecorded] = useState<
    { id: string; at: string; text: string }[]
  >([]);

  const rows = patients.data ?? [];
  const selected = useMemo(
    () => rows.find((p) => p.id === (selectedId ?? rows[0]?.id)) ?? null,
    [rows, selectedId],
  );

  const columns: DataColumn<DoctorPatient>[] = [
    {
      key: "name",
      header: "Patient",
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-xs text-muted-foreground">
            {r.ageBand} · sample record
          </p>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      hideBelow: "md",
      sortValue: (r) => r.reason,
      render: (r) => r.reason,
    },
    {
      key: "lastVisit",
      header: "Last seen",
      hideBelow: "sm",
      sortValue: (r) => r.lastVisit,
      render: (r) => shortDate(`${r.lastVisit}T00:00:00.000Z`),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => (
        <StatusPill label={statusLabel[r.status]} tone={statusTone[r.status]} />
      ),
    },
  ];

  const waiting = rows.filter((p) => p.status === "waiting").length;
  const inConsult = rows.filter((p) => p.status === "in_consult").length;
  const todayAppointments = (appointments.data ?? []).filter((a) =>
    a.at.startsWith("2026-08-16"),
  );

  return (
    <div className="rise space-y-6">
      <PageHeader
        title="Clinician Workspace & Overview"
        demo
        description="Patient medical records, weekly clinical workflow telemetry, assistive summaries, and timestamped consultation notes."
      />

      {/* Patient Database Quick Search Bar */}
      <div className="surface p-4 shadow-soft">
        <PatientSearchBar
          onSelectPatient={(pt) => {
            setSelectedId(pt.id);
            setActiveTab("records");
          }}
        />
      </div>

      {/* Metric Tiles */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rise">
          <StatTile
            label="On the list"
            value={String(rows.length)}
            icon={Users}
            hint="Active patient records"
          />
        </div>
        <div className="rise" style={{ animationDelay: "60ms" }}>
          <StatTile
            label="Waiting"
            value={String(waiting)}
            icon={Stethoscope}
            tone="attention"
            hint="Awaiting clinician consult"
          />
        </div>
        <div className="rise" style={{ animationDelay: "120ms" }}>
          <StatTile
            label="In consult"
            value={String(inConsult)}
            icon={ClipboardCheck}
            hint="Active review in progress"
          />
        </div>
        <div className="rise" style={{ animationDelay: "180ms" }}>
          <StatTile
            label="Today's clinic"
            value={String(todayAppointments.length)}
            icon={CalendarClock}
            hint="Scheduled appointments"
          />
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("records")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "records"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <Users className="size-3.5" />
          Patient Registry & Records
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vitals")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "vitals"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <HeartPulse className="size-3.5" />
          Patient Health Metrics Dashboard
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chart")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "chart"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <TrendingUp className="size-3.5" />
          Weekly Clinical Volume Line Chart
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "notes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <FileEdit className="size-3.5" />
          Doctor Consultation Notes Form
        </button>
      </div>

      {/* Tab: Patient Health Metrics Dashboard */}
      {activeTab === "vitals" && (
        <div className="rise space-y-6">
          <PatientHealthMetricsDashboard
            initialPatientId={selected?.id ?? "pt-1"}
          />
        </div>
      )}

      {/* Tab: Weekly Workflow Chart */}
      {activeTab === "chart" && (
        <div className="rise space-y-6">
          <WeeklyWorkflowChart />
        </div>
      )}

      {/* Tab: Doctor Consultation Notes Form */}
      {activeTab === "notes" && (
        <div className="rise space-y-6">
          <ClinicalNotesForm initialPatientId={selected?.id} />
        </div>
      )}

      {/* Tab: Patient Registry & Interactive Review */}
      {activeTab === "records" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <WorkspaceSection
            title="Patient list"
            description="Select a patient to open their record, assistive summary and decision controls."
          >
            <AsyncSection
              query={patients}
              emptyIcon={Users}
              emptyTitle="No patients on the list"
              emptyDescription="When patients are assigned to this clinician they appear here."
              isEmpty={(d) => d.length === 0}
              skeletonRows={4}
            >
              {(data) => (
                <DataTable
                  rows={data}
                  columns={columns}
                  getId={(r) => r.id}
                  searchText={(r) =>
                    `${r.name} ${r.reason} ${r.currentMedicines.join(" ")}`
                  }
                  searchPlaceholder="Search patients or reasons…"
                  pageSize={6}
                  initialSort={{ key: "name", direction: "asc" }}
                  onRowClick={(r) => setSelectedId(r.id)}
                  filters={[
                    {
                      key: "status",
                      label: "Status",
                      options: Object.entries(statusLabel).map(
                        ([value, label]) => ({
                          value,
                          label,
                        }),
                      ),
                      predicate: (r, v) => r.status === v,
                    },
                  ]}
                  rowActions={(r) => (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedId(r.id)}
                    >
                      Open record
                    </Button>
                  )}
                />
              )}
            </AsyncSection>
          </WorkspaceSection>

          <div className="space-y-6">
            {selected ? (
              <>
                <WorkspaceSection
                  title={selected.name}
                  description={`${selected.reason} · last seen ${shortDate(`${selected.lastVisit}T00:00:00.000Z`)}`}
                  actions={
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab("vitals")}
                        className="h-7 gap-1 rounded-lg text-xs font-semibold"
                      >
                        <HeartPulse className="size-3 text-rose-500" />
                        Health Metrics
                      </Button>
                      <StatusPill
                        label={statusLabel[selected.status]}
                        tone={statusTone[selected.status]}
                      />
                    </div>
                  }
                >
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Allergies (patient reported)
                      </dt>
                      <dd className="mt-1 text-sm">
                        {selected.allergies.length ? (
                          <ul className="space-y-1">
                            {selected.allergies.map((a) => (
                              <li
                                key={a}
                                className="rounded-md bg-destructive-soft px-2 py-1 text-destructive font-medium"
                              >
                                {a}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground">
                            None recorded by the patient.
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Current medicines
                      </dt>
                      <dd className="mt-1 space-y-1 text-sm">
                        {selected.currentMedicines.length ? (
                          selected.currentMedicines.map((m) => (
                            <p
                              key={m}
                              className="rounded-md bg-secondary px-2 py-1 font-medium"
                            >
                              {m}
                            </p>
                          ))
                        ) : (
                          <span className="text-muted-foreground">
                            None recorded.
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <AiAssistNotice className="mt-4">
                    <p>{selected.aiSummary}</p>
                  </AiAssistNotice>
                </WorkspaceSection>

                <WorkspaceSection
                  title="Medicine history"
                  description="Combined clinic records, uploaded prescriptions and patient entries."
                >
                  <AsyncSection
                    query={history}
                    emptyIcon={ClipboardCheck}
                    emptyTitle="No medicine history"
                    emptyDescription="Nothing has been recorded for this patient yet."
                    skeletonRows={3}
                  >
                    {(data) => {
                      const forPatient = data.filter(
                        (h) => h.patientId === selected.id,
                      );
                      if (forPatient.length === 0)
                        return (
                          <p className="text-sm text-muted-foreground">
                            No medicine history recorded.
                          </p>
                        );
                      return (
                        <ul className="divide-y divide-border">
                          {forPatient.map((h) => (
                            <li
                              key={h.id}
                              className="flex flex-wrap items-center gap-2 py-2.5 text-sm"
                            >
                              <span className="font-medium text-ink">
                                {h.medicine} {h.strength}
                              </span>
                              <StatusPill
                                label={
                                  h.status === "current" ? "Current" : "Past"
                                }
                                tone={
                                  h.status === "current"
                                    ? "positive"
                                    : "neutral"
                                }
                              />
                              <span className="ml-auto text-xs text-muted-foreground">
                                {shortDate(`${h.startedOn}T00:00:00.000Z`)}
                                {h.endedOn
                                  ? ` → ${shortDate(`${h.endedOn}T00:00:00.000Z`)}`
                                  : " → ongoing"}{" "}
                                · {h.source}
                              </span>
                            </li>
                          ))}
                        </ul>
                      );
                    }}
                  </AsyncSection>
                </WorkspaceSection>

                <WorkspaceSection
                  title="Final clinical decision"
                  description="Only a clinician can record an outcome. Nothing is applied automatically."
                >
                  <label
                    htmlFor="decision"
                    className="text-sm font-medium text-ink"
                  >
                    Decision note
                  </label>
                  <Textarea
                    id="decision"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    rows={3}
                    placeholder="Record the outcome of this review in your own words…"
                    className="mt-2"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        "Continue current therapy",
                        "Invite to consult",
                        "Refer",
                        "No action",
                      ] as const
                    ).map((label) => (
                      <Button
                        key={label}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDecision((prev) => (prev ? prev : `${label}: `))
                        }
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    className="mt-4"
                    disabled={decision.trim().length < 4}
                    onClick={() => {
                      setRecorded((prev) => [
                        {
                          id: `local-${Date.now()}`,
                          at: new Date().toISOString(),
                          text: decision.trim(),
                        },
                        ...prev,
                      ]);
                      setDecision("");
                      toast.success(
                        "Decision recorded in the demo audit trail",
                      );
                    }}
                  >
                    Record decision
                  </Button>
                </WorkspaceSection>

                <WorkspaceSection
                  title="Audit trail"
                  description="Every entry is attributable and time-stamped."
                >
                  <AsyncSection
                    query={notes}
                    emptyIcon={ClipboardCheck}
                    emptyTitle="No audit entries"
                    emptyDescription="Recorded actions for this patient will appear here."
                    skeletonRows={3}
                  >
                    {(data) => (
                      <Timeline
                        items={[
                          ...recorded.map((r) => ({
                            id: r.id,
                            at: shortDateTime(r.at),
                            title: "Clinical decision recorded",
                            body: r.text,
                            meta: "You (this session)",
                          })),
                          ...data
                            .filter((n) => n.patientId === selected.id)
                            .map((n) => ({
                              id: n.id,
                              at: shortDateTime(n.at),
                              title:
                                n.kind === "ai_review"
                                  ? "Assistive summary regenerated"
                                  : n.kind === "decision"
                                    ? "Clinical decision recorded"
                                    : n.kind === "consult"
                                      ? "Consult completed"
                                      : "Patient activity",
                              body: n.summary,
                              meta: n.author,
                              tone:
                                n.kind === "ai_review"
                                  ? ("ai" as const)
                                  : ("default" as const),
                            })),
                        ]}
                      />
                    )}
                  </AsyncSection>
                </WorkspaceSection>
              </>
            ) : (
              <WorkspaceSection
                title="Patient record"
                description="Select a patient from the list."
              >
                <p className="text-sm text-muted-foreground">
                  No patient selected.
                </p>
              </WorkspaceSection>
            )}

            <WorkspaceSection
              title="Today's clinic"
              description="Sample schedule for 16 August 2026."
            >
              <AsyncSection
                query={appointments}
                emptyIcon={CalendarClock}
                emptyTitle="Nothing scheduled"
                emptyDescription="Appointments booked for today will appear here."
                skeletonRows={3}
              >
                {(data) => {
                  const today = data.filter((a) =>
                    a.at.startsWith("2026-08-16"),
                  );
                  if (today.length === 0)
                    return (
                      <p className="text-sm text-muted-foreground">
                        No appointments scheduled today.
                      </p>
                    );
                  return (
                    <ul className="divide-y divide-border">
                      {today.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center gap-3 py-2.5 text-sm"
                        >
                          <span className="numeric w-14 font-semibold text-ink">
                            {timeOnly(a.at)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {a.patientName}
                          </span>
                          <StatusPill
                            label={a.status.replace("_", " ")}
                            tone={
                              a.status === "in_consult"
                                ? "info"
                                : a.status === "checked_in"
                                  ? "warning"
                                  : "neutral"
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  );
                }}
              </AsyncSection>
            </WorkspaceSection>
          </div>
        </div>
      )}
    </div>
  );
}
