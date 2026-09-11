import { useState, useEffect } from "react";
import {
  Brain,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getStoredGeminiKey,
  setStoredGeminiKey,
  testGeminiApiKey,
} from "@/ai/providers/gemini";
import { cn } from "@/lib/utils";

interface GeminiConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyUpdated?: () => void;
}

export function GeminiConnectModal({
  open,
  onOpenChange,
  onKeyUpdated,
}: GeminiConnectModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      const existing = getStoredGeminiKey();
      setApiKey(existing);
      setTestResult(
        existing
          ? {
              success: true,
              message: "Active key loaded from secure local storage.",
            }
          : null,
      );
    }
  }, [open]);

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a Gemini API Key to test");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(apiKey.trim());
      setTestResult(res);
      if (res.success) {
        toast.success("Gemini API Key Verified Successfully!");
      } else {
        toast.error("Connection Failed: " + res.message);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Network test failed",
      });
      toast.error("Test error: " + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      setStoredGeminiKey("");
      toast.info(
        "Gemini API Key removed. Medora will use Grounded Clinical RAG Engine.",
      );
      onKeyUpdated?.();
      onOpenChange(false);
      return;
    }

    setStoredGeminiKey(apiKey.trim());
    toast.success("Google Gemini Live AI Connected!", {
      description:
        "Medora Medicine Assistant is now operating with live Google Gemini 1.5 Flash intelligence.",
    });
    onKeyUpdated?.();
    onOpenChange(false);
  };

  const handleClear = () => {
    setApiKey("");
    setStoredGeminiKey("");
    setTestResult(null);
    toast.info("Gemini API Key cleared");
    onKeyUpdated?.();
  };

  const isConnected = Boolean(apiKey.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-2 border-border bg-card p-6 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-emerald-500 text-primary-foreground shadow-sm">
              <Sparkles className="size-5" />
            </span>
            <div>
              <DialogTitle className="font-display text-xl font-extrabold text-ink">
                Google Gemini Live AI Setup
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Connect your Google Gemini API key for real-time generative
                clinical intelligence.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Status Card */}
          <div
            className={cn(
              "flex items-center justify-between rounded-2xl border p-4 transition-all",
              isConnected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                : "border-primary/20 bg-primary/5 text-ink",
            )}
          >
            <div className="flex items-center gap-2.5">
              {isConnected ? (
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Key className="size-5 text-primary shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {isConnected
                    ? "Google Gemini 1.5 Flash Connected"
                    : "Clinical RAG Active (No Key Configured)"}
                </div>
                <p className="text-[11px] opacity-90">
                  {isConnected
                    ? "Live generative model active with Medora RAG grounding."
                    : "Using Medora's built-in Medical Knowledge Graph."}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-mono font-bold uppercase",
                isConnected
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "border-primary/30 text-primary",
              )}
            >
              {isConnected ? "Live API" : "Local RAG"}
            </Badge>
          </div>

          {/* Key Input Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="gemini-key" className="font-bold text-ink">
                Gemini API Key
              </Label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Get a Free Key from Google AI Studio{" "}
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="relative">
              <Input
                id="gemini-key"
                type={showKey ? "text" : "password"}
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                className="pr-20 font-mono text-xs h-10 border-border bg-muted/40"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                  className="size-7 text-muted-foreground hover:text-foreground"
                  title={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </Button>
                {apiKey && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="size-7 text-destructive hover:bg-destructive/10"
                    title="Clear key"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Lock className="size-3 text-emerald-500" />
              Your key is stored only in your local browser storage and never
              sent to any intermediary server.
            </p>
          </div>

          {/* Test Feedback Box */}
          {testResult && (
            <div
              className={cn(
                "rounded-xl border p-3 text-xs leading-relaxed",
                testResult.success
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200",
              )}
            >
              <div className="font-bold flex items-center gap-1.5">
                {testResult.success ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <XCircle className="size-4 text-rose-600" />
                )}
                <span>
                  {testResult.success ? "Test Passed" : "Connection Error"}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] opacity-90">
                {testResult.message}
              </p>
            </div>
          )}

          {/* 3 Step Guide */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
            <span className="font-extrabold uppercase text-[10px] tracking-wider text-muted-foreground">
              How to get a Free Google Gemini API Key (Takes 30 seconds):
            </span>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-muted-foreground font-medium">
              <li>
                Visit{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary underline"
                >
                  Google AI Studio (aistudio.google.com/app/apikey)
                </a>
                .
              </li>
              <li>
                Click <strong>"Create API key"</strong> in your Google account.
              </li>
              <li>
                Copy the key, paste it into the field above, and click{" "}
                <strong>"Save & Connect"</strong>.
              </li>
            </ol>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className="text-xs font-semibold"
          >
            <RefreshCw
              className={cn(
                "mr-1.5 size-3.5",
                testing && "animate-spin text-primary",
              )}
            />
            {testing ? "Testing..." : "Test Connection"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-primary text-primary-foreground font-bold text-xs shadow-md"
            >
              Save & Activate Live AI
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
