import { createFileRoute, Link } from "@tanstack/react-router";
import { ReviewerView } from "@/components/prescription/ReviewerView";
import {
  CheckCircle2,
  FileScan,
  Loader2,
  PencilLine,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ClinicalDisclaimer,
  EmptyState,
  IntegrationNotConnected,
  PageHeader,
  SafetyNotice,
} from "@/components/common/primitives";
import { useStore } from "@/lib/store";
import type { Prescription } from "@/lib/domain";
import { demoPrescriptions } from "@/data/demo-catalog";
import { ocrProvider } from "@/lib/ocr/provider";

export const Route = createFileRoute("/app/prescriptions")({
  head: () => ({
    meta: [
      { title: "Prescriptions — Medora" },
      {
        name: "description",
        content:
          "Upload a prescription, review every extracted line with a confidence score, correct mistakes and turn confirmed items into reminders.",
      },
      { property: "og:title", content: "Prescriptions — Medora" },
      {
        property: "og:description",
        content: "Review extracted prescription lines before anything is used.",
      },
    ],
  }),
  component: PrescriptionsPage,
});

const statusTone: Record<Prescription["status"], string> = {
  extracted: "Needs your review",
  reviewed: "Reviewed by you",
  verified: "Verified by pharmacy",
  rejected: "Rejected",
};

interface ReviewState {
  file: File | null;
  url?: string | undefined;
  template: Prescription;
  step: number;
}

const OCR_STEPS = [
  "Uploading document",
  "Reading document",
  "Extracting text",
  "Identifying medicines",
  "Extracting prescription instructions",
  "Preparing review",
];

function PrescriptionsPage() {
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);
  const { state, savePrescription, addReminder } = useStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<{
    name: string;
    size: string;
    url?: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateTemplate = (template: Prescription) => {
    setPreview({
      name: template.fileName,
      size: "340 KB",
    });
    setUploading(true);
    setProgress(0);

    // Simulate steps
    const tick = window.setInterval(() => {
      setProgress((p) => Math.min(p + 3, 95));
    }, 50);

    window.setTimeout(() => {
      window.clearInterval(tick);
      setProgress(100);
      setUploading(false);

      const hydratedTemplate = {
        ...template,
        id: `rx-${Date.now()}`,
        uploadedAt: new Date().toISOString(),
        status: "extracted" as const,
        items: template.items.map((i) => ({
          ...i,
          id: `${i.id}-${Date.now()}`,
          userConfirmed: false,
        })),
      };

      setReviewState({
        file: null,
        template: hydratedTemplate,
        step: OCR_STEPS.length,
      });
    }, 1800);
  };

  const handleFile = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Unsupported file", {
        description: "Upload a photo (JPG, PNG) or a PDF.",
      });
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("That file is too large", {
        description: "Keep prescriptions under 12 MB.",
      });
      return;
    }

    setPreview({
      name: file.name.slice(0, 80),
      size: `${(file.size / 1024).toFixed(0)} KB`,
      ...(isImage ? { url: URL.createObjectURL(file) } : {}),
    });
    setUploading(true);
    setProgress(10);
    const tick = window.setInterval(
      () => setProgress((p) => Math.min(p + 3, 95)),
      50,
    );

    try {
      const ocrResult = await ocrProvider.extractPrescription(file);
      window.clearInterval(tick);
      setProgress(100);

      const hydratedTemplate: Prescription = {
        id: `rx-${Date.now()}`,
        fileName: file.name.slice(0, 80),
        uploadedAt: new Date().toISOString(),
        status: "extracted" as const,
        prescriberName: ocrResult.prescription.prescriberName,
        patientName: ocrResult.prescription.patientName,
        items: ocrResult.items.map((i, index) => ({
          ...i,
          id: `rx-item-${Date.now()}-${index}`,
          userConfirmed: false,
        })),
      };

      setUploading(false);
      setProgress(0);

      setReviewState({
        file,
        url: isImage ? URL.createObjectURL(file) : undefined,
        template: hydratedTemplate,
        step: OCR_STEPS.length,
      });
    } catch (err) {
      window.clearInterval(tick);
      setUploading(false);
      setProgress(0);
      toast.error("OCR Processing Failed", {
        description:
          "We couldn't extract the prescription reliably. Please try again or review manually.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {reviewState ? (
        <div className="fixed inset-0 z-50 bg-background">
          <ReviewerView
            prescription={reviewState.template}
            fileUrl={reviewState.url}
            fileType={reviewState.file?.type}
            onSave={(finalPrescription) => {
              savePrescription(finalPrescription);
              setReviewState(null);
              setPreview(null);
              toast.success("Prescription saved", {
                description: "You have verified the extracted information.",
              });
            }}
            onCancel={() => {
              if (
                confirm(
                  "Are you sure you want to cancel? Any unsaved review progress will be lost.",
                )
              ) {
                setReviewState(null);
                setPreview(null);
              }
            }}
          />
        </div>
      ) : null}

      <PageHeader
        title="Prescriptions"
        demo
        description="Medora reads a prescription into structured lines and shows how confident the extraction is. Nothing is acted on until you confirm it."
      />

      <section className="surface p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragging
                ? "border-primary bg-primary-soft"
                : "border-border-strong bg-secondary/40"
            }`}
          >
            <span className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary">
              <FileScan className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 font-semibold text-ink">
              Drag a prescription here
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Photo or PDF, up to 12 MB. In this demo the extraction is
              simulated with a sample result, so your file is never uploaded
              anywhere.
            </p>
            <Label htmlFor="rx-file" className="sr-only">
              Prescription file
            </Label>
            <Input
              id="rx-file"
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button
              className="mt-5"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-4" aria-hidden />
              )}
              {uploading ? "Extracting…" : "Choose a file"}
            </Button>

            {/* Quick Presets for Demo Review */}
            <div className="mt-4 flex flex-col items-center gap-1.5 border-t border-border/60 pt-3">
              <span className="text-[11px] font-medium text-muted-foreground">
                Or test with a clinical scenario:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => simulateTemplate(demoPrescriptions[0]!)}
                  disabled={uploading}
                  className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Antibiotic & Infection (Apollo)
                </button>
                <button
                  type="button"
                  onClick={() => simulateTemplate(demoPrescriptions[1]!)}
                  disabled={uploading}
                  className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Diabetes & BP (Manipal)
                </button>
                <button
                  type="button"
                  onClick={() => simulateTemplate(demoPrescriptions[2]!)}
                  disabled={uploading}
                  className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Asthma & Allergy (Fortis)
                </button>
                <button
                  type="button"
                  onClick={() => simulateTemplate(demoPrescriptions[3]!)}
                  disabled={uploading}
                  className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Orthopedic & Pain (Max)
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-ink">Preview</h3>
            {preview ? (
              <div className="mt-3">
                {preview.url ? (
                  <img
                    src={preview.url}
                    alt={`Preview of ${preview.name}`}
                    className="aspect-[3/4] w-full rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="grid aspect-[3/4] w-full place-items-center rounded-md border border-border bg-secondary text-muted-foreground">
                    <FileScan className="size-6" aria-hidden />
                  </div>
                )}
                <p className="mt-2 truncate text-sm font-medium text-foreground">
                  {preview.name}
                </p>
                <p className="text-xs text-muted-foreground">{preview.size}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                The selected file appears here before extraction so you can
                check you picked the right page.
              </p>
            )}
          </div>
        </div>
        {uploading && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {
                  OCR_STEPS[
                    Math.min(
                      Math.floor((progress / 100) * OCR_STEPS.length),
                      OCR_STEPS.length - 1,
                    )
                  ]
                }
                …
              </span>
              <span className="numeric">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </section>

      <IntegrationNotConnected integration="ocr" />

      {state.prescriptions.length === 0 ? (
        <EmptyState
          icon={FileScan}
          title="No prescriptions yet"
          description="Upload one to see how Medora structures each line with a confidence score."
        />
      ) : (
        <div className="space-y-4">
          {state.prescriptions.map((rx) => (
            <article key={rx.id} className="surface overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="font-semibold text-ink">{rx.fileName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {rx.prescriberName} · uploaded{" "}
                    {new Date(rx.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={rx.status === "verified" ? "default" : "secondary"}
                >
                  {statusTone[rx.status]}
                </Badge>
              </header>
              <ul className="divide-y divide-border">
                {rx.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-start gap-4 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">
                        {item.medicineText} {item.strength}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.frequency} · {item.duration}
                        {item.notes ? ` · ${item.notes}` : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress
                          value={Math.round(item.confidence * 100)}
                          className="h-1.5 w-28"
                        />
                        <span className="numeric text-xs text-muted-foreground">
                          {Math.round(item.confidence * 100)}% extraction
                          confidence
                        </span>
                        {item.confidence < 0.85 && (
                          <span className="text-xs font-medium text-warning-foreground">
                            Low — check against the paper copy
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={item.userConfirmed ? "secondary" : "outline"}
                        onClick={() => {
                          savePrescription({
                            ...rx,
                            status: "reviewed",
                            items: rx.items.map((i) =>
                              i.id === item.id
                                ? { ...i, userConfirmed: !i.userConfirmed }
                                : i,
                            ),
                          });
                        }}
                      >
                        {item.userConfirmed ? (
                          <>
                            <CheckCircle2 className="size-3.5" aria-hidden />{" "}
                            Confirmed
                          </>
                        ) : (
                          <>
                            <PencilLine className="size-3.5" aria-hidden />{" "}
                            Confirm line
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!item.userConfirmed}
                        onClick={() => {
                          addReminder({
                            id: `rem-${Date.now()}`,
                            medicineName: item.medicineText,
                            strength: item.strength,
                            times: ["08:00"],
                            startDate: new Date().toISOString().slice(0, 10),
                            endDate: new Date(Date.now() + 6048e5)
                              .toISOString()
                              .slice(0, 10),
                            instruction: `${item.frequency} · ${item.duration}`,
                            sourcePrescriptionId: rx.id,
                            active: true,
                            log: [],
                          });
                          toast.success("Reminder created", {
                            description:
                              "Adjust the times on the reminders page.",
                          });
                        }}
                      >
                        Create reminder
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}

      <SafetyNotice title="Extraction can be wrong" tone="warning">
        Handwriting, scans and abbreviations all cause extraction errors. Medora
        shows a confidence score per line and never fills a gap by guessing. If
        a line looks wrong, trust the paper prescription and your pharmacist —
        not this screen.
      </SafetyNotice>
      <div>
        <Button asChild variant="outline">
          <Link to="/app/reminders">Go to reminders</Link>
        </Button>
      </div>
      <ClinicalDisclaimer />
    </div>
  );
}
