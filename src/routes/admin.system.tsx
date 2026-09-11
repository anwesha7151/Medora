import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Layers,
  Radio,
  RefreshCw,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Truck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  PageHeader,
  SafetyNotice,
  StatTile,
} from "@/components/common/primitives";
import { WorkspaceSection, StatusPill } from "@/components/workspace/parts";

export const Route = createFileRoute("/admin/system")({
  head: () => ({
    meta: [
      { title: "System Health, AI Guardrails & Gateways — Medora Admin" },
      {
        name: "description",
        content:
          "Real-time system telemetry, Gemini AI model latencies, CDSCO data connector status, cold-chain telemetry, and emergency broadcasts.",
      },
      {
        property: "og:title",
        content: "System Health & AI Guardrails — Medora Admin",
      },
    ],
  }),
  component: SystemAdminPage,
});

interface ServiceStatus {
  name: string;
  category:
    "AI & ML" | "Database" | "Government API" | "Logistics" | "Communications";
  latency: number;
  uptime: string;
  status: "operational" | "degraded" | "standby";
  details: string;
}

const SERVICES: ServiceStatus[] = [
  {
    name: "Google Gemini 1.5 Flash (Clinical NLP)",
    category: "AI & ML",
    latency: 124,
    uptime: "99.98%",
    status: "operational",
    details:
      "Zero toxicity flags, strict medical disclaimer guardrails active.",
  },
  {
    name: "CDSCO National Formulary Connector",
    category: "Government API",
    latency: 340,
    uptime: "99.85%",
    status: "operational",
    details: "14,820 molecules indexed; last sync 14 mins ago.",
  },
  {
    name: "Supabase PG-Vector & Realtime Engine",
    category: "Database",
    latency: 42,
    uptime: "100.00%",
    status: "operational",
    details: "Encrypted RLS partition active across Mumbai (ap-south-1).",
  },
  {
    name: "Dunzo / Shadowfax Logistics Gateway",
    category: "Logistics",
    latency: 210,
    uptime: "99.91%",
    status: "operational",
    details: "Live rider assignment & dispatch routing connected.",
  },
  {
    name: "Fast2SMS & Resend Patient Alert Daemon",
    category: "Communications",
    latency: 180,
    uptime: "99.95%",
    status: "operational",
    details: "DLT approved transactional templates registered.",
  },
];

const COLD_CHAIN_SENSORS = [
  {
    location: "Apollo Chemist — Bandra West (Mumbai)",
    temp: 4.2,
    target: "2°C - 8°C",
    status: "optimal",
  },
  {
    location: "MedPlus Central Hub — Koramangala (Bengaluru)",
    temp: 3.8,
    target: "2°C - 8°C",
    status: "optimal",
  },
  {
    location: "Manipal Hospital Cold Storage (Bengaluru)",
    temp: 5.1,
    target: "2°C - 8°C",
    status: "optimal",
  },
  {
    location: "Cipla Distribution Depot (New Delhi)",
    temp: 4.6,
    target: "2°C - 8°C",
    status: "optimal",
  },
];

function SystemAdminPage() {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState(
    "CDSCO Schedule H1 Regulatory Notice",
  );
  const [broadcastBody, setBroadcastBody] = useState(
    "Immediate review requested for new antimicrobial stewardship dosage ceiling mandates.",
  );
  const [clearingCache, setClearingCache] = useState(false);

  const handleClearCache = () => {
    setClearingCache(true);
    setTimeout(() => {
      setClearingCache(false);
      toast.success("Global Edge & Query Cache Flushed", {
        description:
          "All client query workers and catalog memory invalidated successfully.",
      });
    }, 600);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      toast.error("Please fill in both title and message body");
      return;
    }
    setBroadcastOpen(false);
    toast.success("Regulatory Emergency Broadcast Dispatched", {
      description: `Pushed high-priority flash notice to 42 verified pharmacies and 18 doctors.`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="System Health, AI Guardrails & Gateways"
        demo
        description="Monitor platform infrastructure, AI inference latencies, CDSCO government syncs, pharmacy cold-chain sensors, and emergency administrative broadcasts."
      />

      {/* Top Infrastructure Telemetry */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Overall System Uptime"
          value="99.98%"
          icon={Server}
          tone="positive"
          hint="All 5 core microservices healthy"
        />
        <StatTile
          label="Avg Gemini AI Latency"
          value="124 ms"
          icon={Bot}
          tone="positive"
          hint="Target SLA < 400ms"
        />
        <StatTile
          label="Cold-Chain SLA Compliance"
          value="100.0%"
          icon={Thermometer}
          tone="positive"
          hint="4/4 sensor nodes in 2°C-8°C envelope"
        />
        <StatTile
          label="Active Database Connections"
          value="38 Pools"
          icon={Database}
          hint="Supabase Postgres ap-south-1"
        />
      </div>

      <SafetyNotice
        tone="info"
        title="Automated Regulatory Guardrail Protocols Active"
      >
        All AI medical consultations and pharmacist vision OCR jobs are subject
        to automated CDSCO compliance checks, National Medical Commission
        prescriber verification, and DPDP Act zero-data retention policies.
      </SafetyNotice>

      {/* Action Control Panel */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            Administrative System Control Center
          </h3>
          <p className="text-xs text-muted-foreground">
            Execute global administrative actions across all connected clinical
            and pharmacy nodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            disabled={clearingCache}
            className="h-9 font-bold text-xs gap-1.5 rounded-xl"
          >
            <RefreshCw
              className={`size-3.5 ${clearingCache ? "animate-spin text-primary" : ""}`}
            />
            {clearingCache ? "Flushing Cache..." : "Flush Global Cache"}
          </Button>

          <Button
            size="sm"
            onClick={() => setBroadcastOpen(true)}
            className="h-9 font-bold text-xs gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-soft"
          >
            <Radio className="size-4" />
            Dispatch Emergency Broadcast
          </Button>
        </div>
      </div>

      {/* External Connectors & Microservices Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <WorkspaceSection
          title="Microservices & API Gateway Status"
          description="Live heartbeat and response time metrics across critical ecosystem components."
        >
          <div className="space-y-3">
            {SERVICES.map((svc) => (
              <div
                key={svc.name}
                className="rounded-2xl border border-border/80 bg-card/60 p-4 shadow-2xs hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      <Globe className="size-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-ink">{svc.name}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {svc.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {svc.latency}ms
                    </span>
                    <StatusPill label="Operational" tone="positive" />
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate max-w-[340px]">{svc.details}</span>
                  <span className="font-mono text-[11px] font-medium text-foreground">
                    Uptime: {svc.uptime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </WorkspaceSection>

        {/* Cold-Chain IoT Sensor Network */}
        <div className="space-y-6">
          <WorkspaceSection
            title="Cold-Chain IoT Temperature Telemetry"
            description="Vaccine and biological drug storage compliance across accredited pharmacies."
          >
            <div className="space-y-3">
              {COLD_CHAIN_SENSORS.map((s) => (
                <div
                  key={s.location}
                  className="rounded-2xl border border-border/80 bg-card/60 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink truncate max-w-[240px] flex items-center gap-1.5">
                      <Thermometer className="size-3.5 text-blue-500 shrink-0" />
                      {s.location}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs font-extrabold bg-blue-500/10 text-blue-600 border-blue-500/30"
                    >
                      {s.temp}°C
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Target Range: {s.target}</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Compliant
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </WorkspaceSection>

          {/* AI Guardrail Parameters */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
            <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" />
              Clinical AI Safety Thresholds
            </h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                <span>OCR Character Confidence Floor</span>
                <span className="font-mono font-bold text-foreground">
                  85.0%
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                <span>Drug-Drug Interaction Alert Strictness</span>
                <span className="font-mono font-bold text-foreground">
                  Level 1 (Critical Block)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                <span>Prescription Expiry Max Window</span>
                <span className="font-mono font-bold text-foreground">
                  180 Days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Radio className="size-5 text-amber-500" />
              Dispatch Emergency Broadcast
            </DialogTitle>
            <DialogDescription>
              Sends an immediate high-priority clinical or regulatory banner to
              all active pharmacy dispensaries and doctor workspaces.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="broadcast-title" className="text-xs font-bold">
                Broadcast Title / Category
              </Label>
              <Input
                id="broadcast-title"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="broadcast-body" className="text-xs font-bold">
                Urgent Clinical Notice Body
              </Label>
              <Textarea
                id="broadcast-body"
                rows={3}
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                className="text-xs rounded-xl"
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBroadcastOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-soft"
              >
                <Send className="size-3.5" /> Dispatch Alert
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
