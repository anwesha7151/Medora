import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  History,
  Info,
  Pill,
  Save,
  Send,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { demoDoctorPatients, demoMedicines } from "@/data/demo-catalog";
import { shortDateTime } from "@/services/workspace";
import type { ClinicalNote } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface ClinicalNotesFormProps {
  initialPatientId?: string | undefined;
  onSaved?: ((note: ClinicalNote) => void) | undefined;
  className?: string | undefined;
}

export function ClinicalNotesForm({
  initialPatientId,
  onSaved,
  className,
}: ClinicalNotesFormProps) {
  const { state, saveClinicalNote, logActivity } = useStore();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || demoDoctorPatients[0]?.id || "pt-1",
  );
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalAssessment, setClinicalAssessment] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [prescribedMeds, setPrescribedMeds] = useState<string[]>([]);
  const [medInput, setMedInput] = useState("");
  const [followUpDays, setFollowUpDays] = useState("7");
  const [isSaving, setIsSaving] = useState(false);

  const fallbackPatient = demoDoctorPatients[0]!;
  const currentPatient =
    demoDoctorPatients.find((p) => p.id === selectedPatientId) ??
    fallbackPatient;

  const handleAddMed = (medName: string) => {
    if (!medName.trim() || prescribedMeds.includes(medName.trim())) return;
    setPrescribedMeds([...prescribedMeds, medName.trim()]);
    setMedInput("");
  };

  const handleRemoveMed = (medName: string) => {
    setPrescribedMeds(prescribedMeds.filter((m) => m !== medName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !chiefComplaint.trim() ||
      !diagnosis.trim() ||
      !clinicalAssessment.trim()
    ) {
      toast.error(
        "Please fill in Chief Complaint, Diagnosis, and Clinical Assessment.",
      );
      return;
    }

    setIsSaving(true);
    const now = new Date();
    const timestampIso = now.toISOString();

    const noteRecord: ClinicalNote = {
      id: `note-${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      author: "Dr. Sharma, MD",
      doctorName: "Dr. Sharma, MD",
      doctorRole: "Consultant Physician",
      content: `${diagnosis.trim()} — ${clinicalAssessment.trim()}`,
      category: "consult",
      timestamp: timestampIso,
      chiefComplaint: chiefComplaint.trim(),
      diagnosis: diagnosis.trim(),
      clinicalAssessment: clinicalAssessment.trim(),
      treatmentPlan:
        treatmentPlan.trim() || "Symptomatic management and follow-up.",
      prescribedMeds,
      followUpDays: Number(followUpDays) || 7,
      status: "finalized",
    };

    // Save to store and log
    saveClinicalNote(noteRecord);

    logActivity({
      action: "clinical_note",
      title: `Saved Clinical Note: ${currentPatient.name}`,
      detail: `Diagnosis: ${diagnosis.trim()} · Recorded at ${shortDateTime(timestampIso)}`,
      metadata: { noteId: noteRecord.id },
    });

    if (onSaved) {
      onSaved(noteRecord);
    }

    toast.success(`Clinical note saved for ${currentPatient.name}`);

    // Reset form
    setChiefComplaint("");
    setDiagnosis("");
    setClinicalAssessment("");
    setTreatmentPlan("");
    setPrescribedMeds([]);
    setIsSaving(false);
  };

  // Recent notes for this patient
  const patientNotes = (state.clinicalNotes ?? []).filter(
    (n) => n.patientId === currentPatient.id,
  );

  return (
    <div
      id="clinical-notes-container"
      className={cn("rise space-y-6", className)}
    >
      {/* Input Note Form */}
      <form
        id="clinical-note-entry-form"
        onSubmit={handleSubmit}
        className="surface p-5 shadow-soft space-y-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary-soft text-primary">
              <FileEdit className="size-4" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                Record Clinical Consultation Note
              </h3>
              <p className="text-xs text-muted-foreground">
                Document SOAP findings, differential diagnosis, and timestamped
                treatment protocol.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5 text-primary" />
            <span>Timestamp: {shortDateTime(new Date().toISOString())}</span>
          </div>
        </div>

        {/* Patient Selection & Profile Banner */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="clinical-note-patient-select"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Select Patient
            </label>
            <select
              id="clinical-note-patient-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-card px-3 text-xs font-medium text-ink focus:border-primary focus:outline-none"
            >
              {demoDoctorPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.ageBand}) — {p.reason}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-md border border-border bg-secondary/30 p-2.5 text-xs flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">
                {currentPatient.name}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {currentPatient.ageBand}
              </Badge>
            </div>
            <p className="mt-0.5 text-muted-foreground text-[11px] truncate">
              Allergies:{" "}
              {currentPatient.allergies.join(", ") || "None declared"}
            </p>
          </div>
        </div>

        {/* Chief Complaints & Diagnosis */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="chief-complaint-input"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Chief Complaint *
            </label>
            <Input
              id="chief-complaint-input"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g., High grade fever for 3 days with dry cough…"
              className="mt-1 text-xs"
              required
            />
          </div>

          <div>
            <label
              htmlFor="diagnosis-input"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Clinical Diagnosis *
            </label>
            <Input
              id="diagnosis-input"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g., Acute Viral Upper Respiratory Infection"
              className="mt-1 text-xs"
              required
            />
          </div>
        </div>

        {/* Clinical Assessment / SOAP */}
        <div>
          <label
            htmlFor="clinical-assessment-textarea"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Clinical Assessment & Examination Findings (SOAP) *
          </label>
          <Textarea
            id="clinical-assessment-textarea"
            value={clinicalAssessment}
            onChange={(e) => setClinicalAssessment(e.target.value)}
            placeholder="BP: 120/80 mmHg, Pulse: 78 bpm, Chest clear, No wheezing or distress. Vitals stable."
            className="mt-1 min-h-[72px] text-xs leading-relaxed"
            required
          />
        </div>

        {/* Treatment Plan */}
        <div>
          <label
            htmlFor="treatment-plan-textarea"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Treatment Protocol & Patient Instructions
          </label>
          <Textarea
            id="treatment-plan-textarea"
            value={treatmentPlan}
            onChange={(e) => setTreatmentPlan(e.target.value)}
            placeholder="Adequate hydration, steam inhalation, rest, avoid cold beverages. Return immediately if breathlessness develops."
            className="mt-1 min-h-[64px] text-xs leading-relaxed"
          />
        </div>

        {/* Prescribed Medicines Pills */}
        <div className="space-y-2">
          <label
            htmlFor="prescribed-med-input"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Prescribed Medications & Formulations
          </label>
          <div className="flex gap-2">
            <Input
              id="prescribed-med-input"
              value={medInput}
              onChange={(e) => setMedInput(e.target.value)}
              placeholder="Type medicine name (e.g. Dolo 650, Augmentin 625)…"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddMed(medInput);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleAddMed(medInput)}
            >
              Add Med
            </Button>
          </div>

          {/* Quick suggestions from catalog */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-muted-foreground">
              Quick add:
            </span>
            {demoMedicines.slice(0, 4).map((med) => (
              <button
                key={med.id}
                type="button"
                onClick={() =>
                  handleAddMed(
                    `${med.brandName} (${med.activeIngredients[0]?.strength || ""})`,
                  )
                }
                className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-ink hover:bg-secondary/80"
              >
                + {med.brandName}
              </button>
            ))}
          </div>

          {/* Active Prescribed Med List */}
          {prescribedMeds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {prescribedMeds.map((med, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 rounded-md bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary"
                >
                  <Pill className="size-3" />
                  {med}
                  <button
                    type="button"
                    onClick={() => handleRemoveMed(med)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Follow-up & Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <label
              htmlFor="followup-days-select"
              className="text-xs text-muted-foreground whitespace-nowrap"
            >
              Follow-up in:
            </label>
            <select
              id="followup-days-select"
              value={followUpDays}
              onChange={(e) => setFollowUpDays(e.target.value)}
              className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-ink focus:border-primary"
            >
              <option value="3">3 days</option>
              <option value="5">5 days</option>
              <option value="7">7 days (1 week)</option>
              <option value="14">14 days (2 weeks)</option>
              <option value="30">30 days (1 month)</option>
            </select>
          </div>

          <Button
            id="save-clinical-note-btn"
            type="submit"
            disabled={isSaving}
            className="gap-2 text-xs"
          >
            <Save className="size-3.5" />
            {isSaving ? "Saving Note…" : "Save Note to Database"}
          </Button>
        </div>
      </form>

      {/* Historical Clinical Notes for this Patient */}
      <div
        id="patient-notes-history"
        className="surface p-5 shadow-soft space-y-3"
      >
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h4 className="font-display text-xs font-bold text-ink">
              Recorded Clinical Notes for {currentPatient.name} (
              {patientNotes.length})
            </h4>
          </div>
        </div>

        {patientNotes.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No previous consultation notes recorded for this patient. New notes
            saved above will appear here with verification timestamps.
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            {patientNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-border bg-card p-3.5 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">
                    {note.diagnosis || note.content}
                  </span>
                  <time className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {shortDateTime(note.timestamp)}
                  </time>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-medium text-ink">Assessment:</span>{" "}
                  {note.clinicalAssessment || note.content}
                </p>

                {(note.prescribedMeds ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(note.prescribedMeds ?? []).map((m: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        {m}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                  <span>Author: {note.doctorName || note.author}</span>
                  {note.followUpDays ? (
                    <span>Follow-up: in {note.followUpDays} days</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
