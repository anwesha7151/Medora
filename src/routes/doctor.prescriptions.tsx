import { createFileRoute } from "@tanstack/react-router";
import { FileSignature, PenLine, Pill } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, SafetyNotice } from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import {
  AiAssistNotice,
  AsyncSection,
  StatusPill,
  WorkspaceSection,
} from "@/components/workspace/parts";
import { shortDateTime, useWorkspaceData } from "@/services/workspace";
import type { DoctorPrescriptionDraft } from "@/data/workspace-demo";

export const Route = createFileRoute("/doctor/prescriptions")({
  head: () => ({
    meta: [
      { title: "Prescription review — Medora clinician workspace" },
      {
        name: "description",
        content:
          "Review prescription requests, read assistive flags and write prescriptions yourself — nothing is signed automatically.",
      },
      {
        property: "og:title",
        content: "Prescription review — Medora clinician workspace",
      },
      {
        property: "og:description",
        content:
          "Clinician-controlled prescription review and creation in Medora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorPrescriptionsPage,
});

const draftStatus = {
  draft: { label: "Draft", tone: "neutral" },
  awaiting_review: { label: "Awaiting review", tone: "warning" },
  signed: { label: "Signed by clinician", tone: "positive" },
  declined: { label: "Declined", tone: "danger" },
} as const;

function DoctorPrescriptionsPage() {
  const drafts = useWorkspaceData("prescriptionDrafts");
  const patients = useWorkspaceData("doctorPatients");
  const [openId, setOpenId] = useState<string | null>(null);
  const [localState, setLocalState] = useState<
    Record<string, "signed" | "declined">
  >({});

  const columns: DataColumn<DoctorPrescriptionDraft>[] = [
    {
      key: "patient",
      header: "Patient",
      sortValue: (r) => r.patientName,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.patientName}</p>
          <p className="text-xs text-muted-foreground">
            {r.items.map((i) => `${i.medicine} ${i.strength}`).join(", ")}
          </p>
        </div>
      ),
    },
    {
      key: "origin",
      header: "Origin",
      hideBelow: "md",
      sortValue: (r) => r.origin,
      render: (r) => r.origin.replace("_", " "),
    },
    {
      key: "created",
      header: "Received",
      hideBelow: "sm",
      sortValue: (r) => r.createdAt,
      render: (r) => shortDateTime(r.createdAt),
    },
    {
      key: "flags",
      header: "Assistive flags",
      hideBelow: "lg",
      sortValue: (r) => r.aiFlags.length,
      render: (r) =>
        r.aiFlags.length ? (
          <StatusPill label={`${r.aiFlags.length} to review`} tone="info" />
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => {
        const state = localState[r.id] ?? r.status;
        const meta = draftStatus[state];
        return <StatusPill label={meta.label} tone={meta.tone} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescription review & creation"
        demo
        description="Requests arrive here unsigned. Assistive flags are informational only — the clinician writes the medicine, strength and directions."
      />

      <SafetyNotice
        tone="warning"
        title="Nothing is prescribed by the assistant"
      >
        Medora never produces a prescription, a dose or directions. Assistive
        flags surface what is already on file (allergies, existing medicines,
        request origin) so a qualified prescriber can check it faster. Every
        prescription must be written and signed by the clinician.
      </SafetyNotice>

      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">Review queue</TabsTrigger>
          <TabsTrigger value="create">Write a prescription</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-5 space-y-6">
          <WorkspaceSection
            title="Requests awaiting a prescriber"
            description="Filter, sort and open each request."
          >
            <AsyncSection
              query={drafts}
              emptyIcon={FileSignature}
              emptyTitle="Nothing to review"
              emptyDescription="New prescription requests will appear in this queue."
              isEmpty={(d) => d.length === 0}
            >
              {(data) => (
                <DataTable
                  rows={data}
                  columns={columns}
                  getId={(r) => r.id}
                  searchText={(r) =>
                    `${r.patientName} ${r.items.map((i) => i.medicine).join(" ")} ${r.origin}`
                  }
                  searchPlaceholder="Search by patient or medicine…"
                  initialSort={{ key: "created", direction: "desc" }}
                  pageSize={6}
                  filters={[
                    {
                      key: "status",
                      label: "Status",
                      options: Object.entries(draftStatus).map(
                        ([value, meta]) => ({
                          value,
                          label: meta.label,
                        }),
                      ),
                      predicate: (r, v) => (localState[r.id] ?? r.status) === v,
                    },
                    {
                      key: "origin",
                      label: "Origin",
                      options: [
                        { value: "clinician", label: "Clinician" },
                        { value: "patient_request", label: "Patient request" },
                        { value: "repeat_request", label: "Repeat request" },
                      ],
                      predicate: (r, v) => r.origin === v,
                    },
                  ]}
                  rowActions={(r) => (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    >
                      {openId === r.id ? "Hide" : "Review"}
                    </Button>
                  )}
                />
              )}
            </AsyncSection>
          </WorkspaceSection>

          {openId &&
            (drafts.data ?? [])
              .filter((d) => d.id === openId)
              .map((draft) => (
                <WorkspaceSection
                  key={draft.id}
                  title={`Request for ${draft.patientName}`}
                  description={`Received ${shortDateTime(draft.createdAt)} · ${draft.origin.replace("_", " ")}`}
                  actions={
                    <StatusPill
                      {...draftStatus[localState[draft.id] ?? draft.status]}
                    />
                  }
                >
                  <ul className="divide-y divide-border rounded-md border border-border">
                    {draft.items.map((item) => (
                      <li
                        key={`${draft.id}-${item.medicine}`}
                        className="p-3 text-sm"
                      >
                        <p className="font-medium text-ink">
                          {item.medicine} {item.strength} · {item.form}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {item.directionsPlaceholder}
                        </p>
                      </li>
                    ))}
                  </ul>

                  {draft.aiFlags.length > 0 && (
                    <AiAssistNotice className="mt-4">
                      <ul className="list-disc space-y-1 pl-4">
                        {draft.aiFlags.map((flag) => (
                          <li key={flag}>{flag}</li>
                        ))}
                      </ul>
                    </AiAssistNotice>
                  )}

                  {draft.clinicianNote && (
                    <p className="mt-4 rounded-md bg-secondary p-3 text-sm text-muted-foreground">
                      Clinician note: {draft.clinicianNote}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setLocalState((p) => ({ ...p, [draft.id]: "signed" }));
                        toast.success("Recorded as signed by you (demo)");
                      }}
                    >
                      <PenLine className="size-4" aria-hidden /> Sign as
                      prescriber
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLocalState((p) => ({
                          ...p,
                          [draft.id]: "declined",
                        }));
                        toast("Recorded as declined (demo)");
                      }}
                    >
                      Decline and request a consult
                    </Button>
                  </div>
                </WorkspaceSection>
              ))}
        </TabsContent>

        <TabsContent value="create" className="mt-5">
          <PrescriptionComposer
            patientNames={(patients.data ?? []).map((p) => p.name)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrescriptionComposer({ patientNames }: { patientNames: string[] }) {
  const [patient, setPatient] = useState("");
  const [medicine, setMedicine] = useState("");
  const [strength, setStrength] = useState("");
  const [form, setForm] = useState("");
  const [directions, setDirections] = useState("");
  const ready =
    patient &&
    medicine.trim() &&
    strength.trim() &&
    form.trim() &&
    directions.trim().length > 4;

  return (
    <WorkspaceSection
      title="Write a prescription"
      description="Every field is written by the prescriber. Medora does not pre-fill medicines, strengths or directions."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rx-patient">Patient</Label>
          <Select value={patient} onValueChange={setPatient}>
            <SelectTrigger id="rx-patient">
              <SelectValue placeholder="Select a patient" />
            </SelectTrigger>
            <SelectContent>
              {patientNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rx-medicine">Medicine</Label>
          <Input
            id="rx-medicine"
            value={medicine}
            onChange={(e) => setMedicine(e.target.value)}
            placeholder="Written by the prescriber"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rx-strength">Strength</Label>
          <Input
            id="rx-strength"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
            placeholder="e.g. 500 mg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rx-form">Form</Label>
          <Input
            id="rx-form"
            value={form}
            onChange={(e) => setForm(e.target.value)}
            placeholder="e.g. Tablet"
          />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Label htmlFor="rx-directions">Directions</Label>
        <Textarea
          id="rx-directions"
          rows={3}
          value={directions}
          onChange={(e) => setDirections(e.target.value)}
          placeholder="Directions in your own words"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          disabled={!ready}
          onClick={() => {
            toast.success("Prescription drafted and attributed to you (demo)");
            setMedicine("");
            setStrength("");
            setForm("");
            setDirections("");
          }}
        >
          <Pill className="size-4" aria-hidden /> Create and sign
        </Button>
        <p className="text-xs text-muted-foreground">
          In this demo nothing is transmitted to a pharmacy. Production
          deployments require verified prescriber credentials and an audited
          signing step.
        </p>
      </div>
    </WorkspaceSection>
  );
}
