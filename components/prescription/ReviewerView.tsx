import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileScan,
  Maximize2,
  PencilLine,
  RotateCw,
  Save,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { Prescription, PrescriptionItem } from "@/lib/domain";
import { SafetyNotice } from "@/components/common/primitives";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ReviewerViewProps {
  prescription: Prescription;
  fileUrl?: string | undefined;
  fileType?: string | undefined;
  onSave: (prescription: Prescription) => void;
  onCancel: () => void;
}

export function ReviewerView({
  prescription,
  fileUrl,
  fileType,
  onSave,
  onCancel,
}: ReviewerViewProps) {
  const [items, setItems] = useState<PrescriptionItem[]>(prescription.items);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PrescriptionItem>>({});
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const startEdit = (item: PrescriptionItem) => {
    setEditingId(item.id);
    setEditDraft({
      medicineText: item.medicineText,
      strength: item.strength,
      frequency: item.frequency,
      duration: item.duration,
      notes: item.notes,
    });
  };

  const saveEdit = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              ...editDraft,
              userConfirmed: true, // User correction always overrides
            }
          : it,
      ),
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const toggleConfirm = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, userConfirmed: !it.userConfirmed } : it,
      ),
    );
  };

  const verifyAll = () => {
    setItems((prev) => prev.map((it) => ({ ...it, userConfirmed: true })));
  };

  const allVerified = items.every((it) => it.userConfirmed);
  const unverifiedCount = items.filter((it) => !it.userConfirmed).length;

  const handleFinalSave = () => {
    onSave({
      ...prescription,
      status: "reviewed",
      items,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden bg-background">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ChevronLeft className="size-4 mr-1" /> Back
          </Button>
          <div>
            <h2 className="font-semibold text-ink text-sm">
              Reviewing: {prescription.fileName}{" "}
              <Badge variant="secondary" className="ml-2 font-mono text-[10px]">
                DEMO OCR
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Uploaded {new Date(prescription.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unverifiedCount > 0 ? (
            <span className="text-sm font-medium text-warning-foreground">
              {unverifiedCount} fields need review
            </span>
          ) : (
            <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="size-4" /> All verified
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={verifyAll}
            disabled={allVerified}
          >
            Verify All
          </Button>
          <Button
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={!allVerified}
          >
            Save Prescription
          </Button>
        </div>
      </header>

      {/* Main Content Side-by-Side */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left: Original Document */}
        <div className="flex-1 border-r border-border bg-muted/20 flex flex-col min-h-0 lg:max-w-[50%]">
          <div className="flex items-center justify-between p-2 border-b border-border/50 bg-card/50">
            <span className="text-xs font-medium text-muted-foreground ml-2 uppercase tracking-wider">
              Original Document
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              >
                <ZoomIn className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setRotation((r) => (r + 90) % 360)}
              >
                <RotateCw className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative">
            {fileUrl ? (
              fileType === "application/pdf" ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full rounded shadow-sm border border-border bg-white"
                  title="PDF Preview"
                />
              ) : (
                <div
                  className="transition-transform duration-200 ease-out origin-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={fileUrl}
                    alt="Prescription scan"
                    className="max-w-full rounded shadow-sm border border-border bg-white"
                  />
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground p-8 text-center max-w-sm">
                <FileScan className="size-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">Demo OCR Processing</p>
                <p className="text-xs mt-1">
                  We are showing simulated data for this demo. Normally, your
                  uploaded document would appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Extracted Data */}
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
          <div className="p-4 border-b border-border/50 bg-card/50 sticky top-0 z-10 backdrop-blur-md">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Extracted Information
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Review and correct the extracted text below. Your corrections
              override OCR output.
            </p>
          </div>

          <div className="p-4 space-y-4">
            {items.map((item) => {
              const isEditing = editingId === item.id;
              const isVerified = item.userConfirmed;
              const isLowConfidence = item.confidence < 0.8;

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border transition-colors ${
                    isEditing
                      ? "border-primary shadow-sm"
                      : isVerified
                        ? "border-border bg-card"
                        : "border-warning/40 bg-warning/5"
                  }`}
                >
                  {/* Item Header */}
                  <div
                    className={`flex items-center justify-between px-4 py-2 border-b ${
                      isEditing
                        ? "border-primary/20 bg-primary/5"
                        : isVerified
                          ? "border-border bg-secondary/30"
                          : "border-warning/20 bg-warning/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {isEditing ? "Editing Field" : item.medicineText}
                      </span>
                      {!isEditing && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <Progress
                            value={Math.round(item.confidence * 100)}
                            className="h-1.5 w-16"
                          />
                          <span className="numeric text-[10px] text-muted-foreground">
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={isVerified ? "default" : "secondary"}
                      className={
                        !isVerified
                          ? "bg-warning/20 text-warning-foreground hover:bg-warning/30 border-warning/30"
                          : ""
                      }
                    >
                      {isVerified ? "User verified ✓" : "Needs review"}
                    </Badge>
                  </div>

                  {/* Item Content */}
                  <div className="p-4">
                    {isEditing ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label>Medicine Name</Label>
                          <Input
                            value={editDraft.medicineText || ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                medicineText: e.target.value,
                              }))
                            }
                            autoFocus
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Strength</Label>
                          <Input
                            value={editDraft.strength || ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                strength: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Frequency</Label>
                          <Input
                            value={editDraft.frequency || ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                frequency: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Duration</Label>
                          <Input
                            value={editDraft.duration || ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                duration: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Additional Notes</Label>
                          <Input
                            value={editDraft.notes || ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                notes: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => saveEdit(item.id)}>
                            Save & Verify
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">
                            Strength
                          </p>
                          <p className="text-sm">{item.strength || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">
                            Frequency
                          </p>
                          <p className="text-sm flex items-center gap-1.5">
                            {item.frequency || "—"}
                            {isLowConfidence && !isVerified && (
                              <AlertTriangle className="size-3 text-warning-foreground" />
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">
                            Duration
                          </p>
                          <p className="text-sm flex items-center gap-1.5">
                            {item.duration || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">
                            Notes
                          </p>
                          <p className="text-sm">{item.notes || "—"}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="px-4 py-2 bg-muted/30 border-t border-border flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(item)}
                      >
                        <PencilLine className="size-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant={isVerified ? "outline" : "secondary"}
                        size="sm"
                        onClick={() => toggleConfirm(item.id)}
                        className={
                          !isVerified
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : ""
                        }
                      >
                        {isVerified ? (
                          <>
                            <X className="size-3.5 mr-1" /> Unverify
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-3.5 mr-1" /> Verify
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 mt-auto">
            <SafetyNotice
              title="Handwritten Prescription Safety"
              tone="warning"
            >
              Handwritten or unclear text may be difficult to interpret
              automatically. Please verify every extracted field with the
              original prescription and consult a pharmacist or doctor if
              uncertain.
            </SafetyNotice>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Prescription</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm that you have reviewed the extracted information
              against the original prescription. This data will be saved to your
              profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalSave}>
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
