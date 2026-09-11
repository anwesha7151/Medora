import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck,
  FileEdit,
  FileText,
  Heart,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Pill,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  Video,
  Volume2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatTile } from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/consults")({
  head: () => ({
    meta: [
      { title: "Teleconsult & Virtual OPD — Clinician Workspace | Medora" },
      {
        name: "description",
        content:
          "Conduct secure end-to-end encrypted virtual patient consults, record structured SOAP notes, and dispatch digitally signed e-prescriptions.",
      },
    ],
  }),
  component: DoctorConsultsPage,
});

interface ConsultQueueItem {
  id: string;
  patientName: string;
  patientAge: string;
  gender: string;
  symptoms: string;
  scheduledTime: string;
  status: "waiting" | "in_progress" | "completed";
  vitals: {
    bp: string;
    pulse: string;
    spo2: string;
    temp: string;
  };
}

const DEMO_QUEUE: ConsultQueueItem[] = [
  {
    id: "TC-401",
    patientName: "Rahul Verma",
    patientAge: "34",
    gender: "Male",
    symptoms: "Fever for 3 days (101°F), dry cough, body aches",
    scheduledTime: "10:30 AM (Now)",
    status: "in_progress",
    vitals: { bp: "124/82", pulse: "84", spo2: "99%", temp: "100.8°F" },
  },
  {
    id: "TC-402",
    patientName: "Pooja Hegde",
    patientAge: "28",
    gender: "Female",
    symptoms: "Persistent migraine with photophobia, nausea",
    scheduledTime: "11:00 AM",
    status: "waiting",
    vitals: { bp: "118/76", pulse: "72", spo2: "99%", temp: "98.4°F" },
  },
  {
    id: "TC-403",
    patientName: "Kishore Kumar",
    patientAge: "61",
    gender: "Male",
    symptoms: "Post-prandial glycemic spike follow-up, foot tingling",
    scheduledTime: "11:30 AM",
    status: "waiting",
    vitals: { bp: "138/88", pulse: "78", spo2: "98%", temp: "98.6°F" },
  },
];

function DoctorConsultsPage() {
  const [activeConsult, setActiveConsult] = useState<ConsultQueueItem>(
    DEMO_QUEUE[0]!,
  );
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [callActive, setCallActive] = useState(true);

  // SOAP Note Form States
  const [soapSubjective, setSoapSubjective] = useState(
    "Patient reports 3-day history of acute febrile illness with peak temperature 101°F, intermittent dry cough, myalgia and mild throat irritation. No chest tightness, no hemoptysis.",
  );
  const [soapObjective, setSoapObjective] = useState(
    "Vitals: BP 124/82 mmHg, Pulse 84 bpm regular, SpO2 99% on room air, Temp 100.8°F. Throat: mild pharyngeal erythema without tonsillar exudates. Chest: Bilateral vesicular breath sounds, no rhonchi/crepts.",
  );
  const [soapAssessment, setSoapAssessment] = useState(
    "ICD-10 J06.9 — Acute upper respiratory tract infection (URTI), viral etiology likely. Rule out secondary bacterial infection.",
  );
  const [soapPlan, setSoapPlan] = useState(
    "1. Tab Paracetamol 650mg TDS x 3 days post meals.\n2. Steam inhalation with saline nasal spray.\n3. Adequate hydration (3L fluid/day).\n4. Red-flag advisory: If fever persists > 5 days or dyspnea develops, report to emergency OPD.",
  );

  const handleEndCall = () => {
    setCallActive(false);
    toast.info("Teleconsultation video call ended.");
  };

  const handleRestartCall = () => {
    setCallActive(true);
    toast.success("Reconnected to encrypted video channel.");
  };

  const handleDispatchPrescription = () => {
    toast.success(`Digitally Signed e-Prescription Dispatched!`, {
      description: `Sent to ${activeConsult.patientName}'s Medora Patient Portal and linked to local pharmacy.`,
    });
  };

  const handleAiSoapRefine = () => {
    toast.success("AI Clinical Copilot Refined SOAP Note", {
      description: "ICD-10 clinical tags and dosage schedules standardized.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teleconsult & Virtual OPD Suite"
        description="Conduct secure video consultations, record structured SOAP clinical notes, and generate digitally signed e-prescriptions."
        actions={
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs"
          >
            WebRTC Telehealth Live
          </Badge>
        }
      />

      {/* Main Consult Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Room & Queue (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Video Stream Container */}
          <div className="relative rounded-3xl overflow-hidden border border-border bg-zinc-950 aspect-video shadow-md flex flex-col justify-between p-4">
            {callActive ? (
              <>
                {/* Top Overlay Badge */}
                <div className="flex items-center justify-between z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1 text-xs font-bold text-white border border-white/10">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Encrypted · {activeConsult.patientName}
                  </span>

                  <span className="text-[11px] font-mono text-zinc-300 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
                    08:42 min
                  </span>
                </div>

                {/* Simulated Patient Video Box */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-zinc-300">
                  <div className="grid size-20 place-items-center rounded-full bg-primary/20 text-primary border-2 border-primary/30 mb-2">
                    <User className="size-10" />
                  </div>
                  <h4 className="font-display font-bold text-base text-white">
                    {activeConsult.patientName}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Connected via Medora iOS App
                  </p>
                </div>

                {/* Self View Floating Camera (Bottom Right) */}
                <div className="absolute bottom-16 right-4 size-20 rounded-2xl border border-white/20 bg-zinc-800/90 backdrop-blur overflow-hidden z-10 flex flex-col items-center justify-center">
                  <Stethoscope className="size-6 text-primary" />
                  <span className="text-[9px] font-bold text-zinc-300 mt-1">
                    Dr. You
                  </span>
                </div>

                {/* Bottom Call Controls */}
                <div className="flex items-center justify-center gap-3 z-10 mt-auto">
                  <Button
                    size="icon"
                    variant={isMicOn ? "secondary" : "destructive"}
                    className="size-10 rounded-full shadow-md"
                    onClick={() => setIsMicOn(!isMicOn)}
                    title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {isMicOn ? (
                      <Mic className="size-4" />
                    ) : (
                      <MicOff className="size-4" />
                    )}
                  </Button>

                  <Button
                    size="icon"
                    variant={isCamOn ? "secondary" : "destructive"}
                    className="size-10 rounded-full shadow-md"
                    onClick={() => setIsCamOn(!isCamOn)}
                    title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
                  >
                    {isCamOn ? (
                      <Camera className="size-4" />
                    ) : (
                      <CameraOff className="size-4" />
                    )}
                  </Button>

                  <Button
                    size="icon"
                    variant="destructive"
                    className="size-10 rounded-full shadow-md bg-rose-600 hover:bg-rose-700"
                    onClick={handleEndCall}
                    title="End Consultation Call"
                  >
                    <PhoneOff className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <CheckCircle2 className="size-12 text-emerald-500" />
                <h4 className="font-display font-bold text-base text-white">
                  Consultation Concluded
                </h4>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Review the SOAP clinical notes and click below to sign and
                  dispatch the digital prescription.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold"
                  onClick={handleRestartCall}
                >
                  Reconnect Call
                </Button>
              </div>
            )}
          </div>

          {/* Patient Vitals Summary Strip */}
          <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Blood Pressure
              </span>
              <p className="text-xs font-black font-display text-foreground mt-0.5">
                {activeConsult.vitals.bp}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Heart Rate
              </span>
              <p className="text-xs font-black font-display text-foreground mt-0.5">
                {activeConsult.vitals.pulse} bpm
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                SpO2 Oxygen
              </span>
              <p className="text-xs font-black font-display text-emerald-600 dark:text-emerald-400 mt-0.5">
                {activeConsult.vitals.spo2}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Body Temp
              </span>
              <p className="text-xs font-black font-display text-amber-600 dark:text-amber-400 mt-0.5">
                {activeConsult.vitals.temp}
              </p>
            </div>
          </div>

          {/* OPD Queue List */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Today's Virtual OPD Queue</span>
              <Badge variant="outline" className="text-[10px] font-bold">
                {DEMO_QUEUE.length} Patients
              </Badge>
            </h4>

            <div className="space-y-2">
              {DEMO_QUEUE.map((item) => {
                const isSelected = item.id === activeConsult.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveConsult(item);
                      setCallActive(true);
                      toast.info(`Switched to ${item.patientName}`);
                    }}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-2xs"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          item.status === "in_progress"
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-zinc-400",
                        )}
                      />
                      <div>
                        <p className="font-bold text-foreground">
                          {item.patientName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {item.symptoms}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                      {item.scheduledTime}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: SOAP Clinical Notes & Rx Dispatch (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-primary uppercase">
                  EHR Encounter Record
                </span>
                <h3 className="font-display text-base font-extrabold text-foreground mt-0.5">
                  Clinical SOAP Note — {activeConsult.patientName} (
                  {activeConsult.patientAge}y, {activeConsult.gender})
                </h3>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleAiSoapRefine}
                className="h-8 gap-1.5 text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10"
              >
                <Sparkles className="size-3.5" /> AI Format & Refine
              </Button>
            </div>

            {/* SOAP Section 1: Subjective */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="size-4 grid place-items-center rounded bg-primary/10 text-primary text-[10px] font-black">
                  S
                </span>
                Subjective (Chief Complaint & History)
              </Label>
              <Textarea
                value={soapSubjective}
                onChange={(e) => setSoapSubjective(e.target.value)}
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>

            {/* SOAP Section 2: Objective */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="size-4 grid place-items-center rounded bg-primary/10 text-primary text-[10px] font-black">
                  O
                </span>
                Objective (Physical Findings & Vitals)
              </Label>
              <Textarea
                value={soapObjective}
                onChange={(e) => setSoapObjective(e.target.value)}
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>

            {/* SOAP Section 3: Assessment */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="size-4 grid place-items-center rounded bg-primary/10 text-primary text-[10px] font-black">
                  A
                </span>
                Assessment (ICD-10 Clinical Diagnosis)
              </Label>
              <Input
                value={soapAssessment}
                onChange={(e) => setSoapAssessment(e.target.value)}
                className="text-xs rounded-xl h-9 font-medium"
              />
            </div>

            {/* SOAP Section 4: Plan & Rx */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="size-4 grid place-items-center rounded bg-primary/10 text-primary text-[10px] font-black">
                  P
                </span>
                Plan & Digital Prescription Regimen
              </Label>
              <Textarea
                value={soapPlan}
                onChange={(e) => setSoapPlan(e.target.value)}
                rows={4}
                className="text-xs rounded-xl font-mono"
              />
            </div>

            {/* Digital Signature & Dispatch Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>
                  Digitally Signed with Medical Council Registry ID #KMC-84920
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  className="w-full sm:w-auto h-9 font-bold text-xs gap-1.5 rounded-xl shadow-sm"
                  onClick={handleDispatchPrescription}
                >
                  <Send className="size-3.5" /> Sign & Dispatch e-Rx
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
