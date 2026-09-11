import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CameraOff,
  CheckCircle2,
  HelpCircle,
  Maximize2,
  RefreshCw,
  Scan,
  ScanLine,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ClinicalDisclaimer,
  IntegrationNotConnected,
  PageHeader,
  ProvenanceLine,
  RxPill,
  SafetyNotice,
} from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { demoMedicines } from "@/data/demo-catalog";
import type { Medicine } from "@/lib/domain";
import { settle } from "@/services/provider";

export const Route = createFileRoute("/app/verify")({
  head: () => ({
    meta: [
      { title: "Pack Verification & Scanner — Medora" },
      {
        name: "description",
        content:
          "Verify medicine serialisation codes and barcodes using your camera or pack code lookup.",
      },
      { property: "og:title", content: "Pack verification — Medora" },
      {
        property: "og:description",
        content: "Live camera scanner and pack serialization verification.",
      },
    ],
  }),
  component: VerifyPage,
});

type VerifyState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "match"; medicine: Medicine }
  | { kind: "unknown"; code: string };

/** Demo codes map to catalogue entries deterministically: MD- + first 6 chars of the id. */
const demoCodeFor = (m: Medicine) =>
  `MD-${m.id
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 6)
    .toUpperCase()}`;

function VerifyPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyState>({ kind: "idle" });

  // Recent scans state with localStorage persistence
  const [recentScans, setRecentScans] = useState<Medicine[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("medora_recent_scans");
      if (stored) {
        setRecentScans(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to parse recent scans from localStorage", e);
    }
  }, []);

  const addToRecentScans = (med: Medicine) => {
    setRecentScans((prev) => {
      const filtered = prev.filter((m) => m.id !== med.id);
      const next = [med, ...filtered].slice(0, 5);
      localStorage.setItem("medora_recent_scans", JSON.stringify(next));
      return next;
    });
  };

  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      toast.success("Camera activated", {
        description:
          "Point your camera at the barcode or 2D DataMatrix on the medicine pack.",
      });
    } catch (err) {
      console.warn("Camera access error:", err);
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access or use manual code entry."
          : "Could not access video device. You can test using the manual code input or test codes below.";
      setCameraError(msg);
      setIsCameraActive(false);
      toast.error("Camera unavailable", { description: msg });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleFacingMode = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    if (isCameraActive) {
      void startCamera();
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const verify = async (value: string) => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Enter a pack code to check.");
      return;
    }
    setResult({ kind: "loading" });
    const match = demoMedicines.find((m) => demoCodeFor(m) === trimmed);
    const next = await settle<VerifyState>(
      match
        ? { kind: "match", medicine: match }
        : { kind: "unknown", code: trimmed },
      700,
    );
    setResult(next);
    if (match) {
      toast.success(`Verified: ${match.brandName}`, {
        description: "Medicine successfully identified in the catalog.",
      });
      addToRecentScans(match);
    } else {
      toast.error("Unrecognized barcode or serialisation code.", {
        description:
          "Manual pack verification entry is required to confirm this item.",
      });
    }
  };

  const simulateScan = (med: Medicine) => {
    const generatedCode = demoCodeFor(med);
    setCode(generatedCode);
    toast.info(`Barcode scanned from viewfinder: ${generatedCode}`);
    void verify(generatedCode);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pack Verification & Barcode Scanner"
        demo
        description="Verify GS1 barcodes and authentication serialization codes printed on medicine packaging against the Medora verified catalog."
      />

      <IntegrationNotConnected integration="barcode" />

      {/* Live Camera Viewfinder Card */}
      <section className="surface overflow-hidden p-0">
        <div className="border-b border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`size-2.5 rounded-full ${
                  isCameraActive
                    ? "animate-pulse bg-emerald-500"
                    : "bg-muted-foreground"
                }`}
              />
              <span className="font-semibold text-sm">
                {isCameraActive ? "Live Camera Viewfinder" : "Optical Scanner"}
              </span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                1D / 2D Barcode & GS1 DataMatrix
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCameraActive ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFacingMode}
                    className="h-8 gap-1.5 text-xs"
                    title="Flip camera"
                  >
                    <RefreshCw className="size-3.5" /> Flip Camera
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopCamera}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <CameraOff className="size-3.5" /> Turn Off
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={startCamera}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <Camera className="size-3.5" /> Activate Scanner
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Viewfinder Window */}
        <div className="relative flex min-h-[300px] w-full flex-col items-center justify-center bg-slate-950 text-white sm:min-h-[380px]">
          {isCameraActive ? (
            <div className="relative size-full overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full max-h-[420px] object-cover"
              />

              {/* Viewfinder Reticle Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div className="relative size-56 sm:size-72 rounded-2xl border-2 border-primary/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  {/* Corner brackets */}
                  <div className="absolute -left-1 -top-1 size-6 border-l-4 border-t-4 border-primary rounded-tl-md" />
                  <div className="absolute -right-1 -top-1 size-6 border-r-4 border-t-4 border-primary rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 size-6 border-b-4 border-l-4 border-primary rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 size-6 border-b-4 border-r-4 border-primary rounded-br-md" />

                  {/* Animated laser scanning line */}
                  <motion.div
                    className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_#3b82f6]"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.5,
                      ease: "linear",
                    }}
                  />

                  <div className="absolute bottom-3 inset-x-0 text-center">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                      Align barcode inside frame
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 rounded-full bg-white/5 p-4 ring-1 ring-white/10">
                <Scan className="size-8 text-white/70" />
              </div>
              <h3 className="font-semibold text-base text-white">
                Camera Viewfinder Inactive
              </h3>
              <p className="mt-1 max-w-sm text-xs text-white/60">
                Tap Activate Scanner to open your device camera, or use the
                interactive test codes below to simulate an immediate optical
                scan.
              </p>
              <Button
                size="sm"
                onClick={startCamera}
                className="mt-4 gap-2 text-xs font-semibold"
              >
                <Camera className="size-3.5" /> Start Camera Viewfinder
              </Button>
            </div>
          )}

          {cameraError && (
            <div className="absolute bottom-4 inset-x-4 max-w-md mx-auto rounded-lg bg-red-950/90 border border-red-500/30 p-3 text-left backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200">{cameraError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Optical Scan Simulators */}
        <div className="border-t border-border bg-card p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-500" />
              Simulate barcode detection on viewfinder:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {demoMedicines.slice(0, 4).map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => simulateScan(med)}
                  className="rounded border border-border bg-muted/50 px-2.5 py-1 font-mono text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
                >
                  {demoCodeFor(med)} ({med.brandName})
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const badCode = "MD-INVALID-99";
                  setCode(badCode);
                  void verify(badCode);
                }}
                className="rounded border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                Simulate Unknown Code
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Manual Code Lookup Form */}
      <form
        className="surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void verify(code);
        }}
      >
        <Label htmlFor="pack-code" className="font-semibold text-sm">
          Manual Pack Serialization Code Lookup
        </Label>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          If the barcode on your box is damaged or smudged, enter the
          alphanumeric code printed near the expiry date.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="pack-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. MD-MEDPAR"
            className="font-mono text-sm"
          />
          <Button
            type="submit"
            disabled={result.kind === "loading"}
            className="gap-2"
          >
            <ScanLine className="size-4" aria-hidden />
            {result.kind === "loading" ? "Verifying…" : "Check Pack"}
          </Button>
        </div>
      </form>

      {/* Verification Result Skeleton */}
      {result.kind === "loading" && (
        <div className="surface space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {/* Match Found */}
      {result.kind === "match" && (
        <section className="surface p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/35 bg-success-soft px-3 py-1 text-xs font-semibold text-success">
              <BadgeCheck className="size-4" aria-hidden /> Authentic Demo
              Catalog Record Match
            </span>
            <RxPill prescriptionOnly={result.medicine.prescriptionOnly} />
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            {result.medicine.brandName}
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            {result.medicine.genericName} · {result.medicine.form} ·{" "}
            {result.medicine.packSize}
          </p>

          <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Active Composition
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {result.medicine.activeIngredients
                  .map((i) => `${i.name} ${i.strength}`)
                  .join(" + ")}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Manufacturer
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {result.medicine.manufacturer}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Storage & Integrity
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {result.medicine.storage}
              </dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-border pt-4">
            <ProvenanceLine provenance={result.medicine.provenance} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button asChild size="sm">
              <Link
                to="/app/medicine/$medicineId"
                params={{ medicineId: result.medicine.id }}
              >
                View Full Monograph & Equivalents
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/app/compare"
                search={{
                  key: result.medicine.compositionKey,
                  name: result.medicine.brandName,
                }}
              >
                Compare Prices Across Pharmacies
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Unknown Code */}
      {result.kind === "unknown" && (
        <SafetyNotice
          tone="warning"
          title={`Unverified Pack Code: ${result.code}`}
        >
          No record in the catalog matches that code. This does not definitively
          indicate that the packaging is counterfeit — Medora operates with an
          explicit provider boundary and requires a connected national
          serialization registry (e.g. GS1 / CDSCO Traceability) to verify
          unlisted batches. If you have concerns regarding packaging
          authenticity, consult your dispensing pharmacy.
        </SafetyNotice>
      )}

      {/* Recent Scans History */}
      {recentScans.length > 0 && (
        <section className="mt-8 space-y-3">
          <h3 className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-2">
            <ScanLine className="size-4 text-primary" aria-hidden />
            Recent Scans
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentScans.map((med, index) => (
              <div
                key={`${med.id}-${index}`}
                className="surface p-3 flex items-center gap-3 cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => verify(demoCodeFor(med))}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {med.brandName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {med.genericName} • {demoCodeFor(med)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ClinicalDisclaimer />
    </div>
  );
}
