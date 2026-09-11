import { createFileRoute } from "@tanstack/react-router";
import {
  Brain,
  Check,
  Copy,
  Download,
  Flag,
  Globe,
  HelpCircle,
  MessageSquare,
  Pill,
  RotateCcw,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { capabilityLabels } from "@/ai/registry";
import { summarise } from "@/ai/render";
import { ASSISTANT_ROLE_STATEMENT } from "@/ai/safety";
import {
  useAiConversation,
  type ConversationTurn,
} from "@/ai/useAiConversation";
import { AiPayloadView } from "@/components/ai/AiPayloadView";
import { LiveGoogleSearchGrounding } from "@/components/ai/LiveGoogleSearchGrounding";
import {
  ConfidenceBadge,
  ModeBadge,
  PipelineTrace,
  SafetyStrip,
  SourceChips,
} from "@/components/ai/ai-parts";
import { PageHeader, SafetyNotice } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/app/assistant")({
  head: () => ({
    meta: [
      { title: "Medicine assistant — Medora" },
      {
        name: "description",
        content:
          "Ask about a medicine and get a source-labelled explanation. Informational only — Medora never diagnoses or prescribes.",
      },
      { property: "og:title", content: "Medicine assistant — Medora" },
      {
        property: "og:description",
        content: "Source-labelled medicine explanations with safety notes.",
      },
    ],
  }),
  component: MedicineAssistantPage,
});

interface PromptCategory {
  title: string;
  prompts: string[];
}

const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    title: "Safety & Interactions",
    prompts: [
      "Can I take ibuprofen with metformin?",
      "Is paracetamol safe with amoxicillin?",
      "What common medicines interact with blood thinners?",
    ],
  },
  {
    title: "Dosage & Side Effects",
    prompts: [
      "What is Panacet 500 used for?",
      "What are the common side effects of Metformin 500 mg?",
      "How should I take antibiotics with meals?",
    ],
  },
  {
    title: "Comparison & Value",
    prompts: [
      "Compare cetirizine products in the catalogue",
      "What are generic alternatives for branded atorvastatin?",
      "Which pharmacy offers lowest cost for Amoxicillin 500mg?",
    ],
  },
  {
    title: "Symptoms & Labs",
    prompts: [
      "What does an HbA1c result of 6.8% indicate?",
      "I've had a headache for 3 days",
      "What does high fasting blood glucose mean?",
    ],
  },
];

function TurnCard({
  turn,
  onRetry,
  onFeedback,
  onAsk,
}: {
  turn: ConversationTurn;
  onRetry: (id: string) => void;
  onFeedback: (id: string, value: "helpful" | "unhelpful" | "reported") => void;
  onAsk: (q: string) => void;
}) {
  const envelope = turn.envelope;
  const [copied, setCopied] = useState(false);

  const copyTurn = () => {
    const lead = envelope ? summarise(envelope.payload).lead : "";
    const headline = envelope ? summarise(envelope.payload).headline : "";
    const text = `Q: ${turn.question}\n\nA: ${headline}\n${lead}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Answer copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-xs">
          {turn.question}
        </p>
      </div>

      <div className="surface space-y-4 rounded-2xl border border-border p-4 sm:p-5 shadow-xs">
        {turn.status === "thinking" && (
          <div className="space-y-3" aria-live="polite">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-primary" />
              </span>
              Detecting clinical intent, retrieving verified sources and running
              safety checks…
            </p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {turn.status === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{turn.error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRetry(turn.id)}
            >
              <RotateCcw className="mr-1.5 size-3.5" /> Retry
            </Button>
          </div>
        )}

        {envelope && turn.status !== "error" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <ModeBadge envelope={envelope} />
              <ConfidenceBadge envelope={envelope} />
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground bg-muted/30">
                {capabilityLabels[envelope.capability]}
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">
                {summarise(envelope.payload).headline}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {turn.status === "streaming"
                  ? turn.streamedText
                  : summarise(envelope.payload).lead}
                {turn.status === "streaming" && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
                )}
              </p>
            </div>

            {turn.status === "complete" && (
              <>
                <AiPayloadView payload={envelope.payload} />

                {/* Unified Verification Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5">
                  <SourceChips sources={envelope.sources} />
                  <SafetyStrip safety={envelope.safety} />
                </div>

                <PipelineTrace trace={envelope.trace} />

                {envelope.followUps.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Follow-up suggestions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {envelope.followUps.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => onAsk(q)}
                          className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:border-primary hover:bg-primary/5 text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    Was this useful?
                  </span>
                  <Button
                    size="sm"
                    variant={
                      turn.feedback === "helpful" ? "secondary" : "ghost"
                    }
                    onClick={() => {
                      onFeedback(turn.id, "helpful");
                      toast.success(
                        "Thanks — feedback recorded on this device.",
                      );
                    }}
                  >
                    <ThumbsUp className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      turn.feedback === "unhelpful" ? "secondary" : "ghost"
                    }
                    onClick={() => {
                      onFeedback(turn.id, "unhelpful");
                      toast(
                        "Recorded. Medora will not act on this without a clinician review.",
                      );
                    }}
                  >
                    <ThumbsDown className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      turn.feedback === "reported" ? "destructive" : "ghost"
                    }
                    onClick={() => {
                      onFeedback(turn.id, "reported");
                      toast("Reported for clinical safety review.");
                    }}
                  >
                    <Flag className="mr-1.5 size-3.5" /> Report
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyTurn}
                    className="gap-1.5 text-xs text-muted-foreground"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => onRetry(turn.id)}
                  >
                    <RotateCcw className="mr-1.5 size-3.5" /> Regenerate
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MedicineAssistantPage() {
  const { turns, ask, retry, setFeedback, clear, busy } = useAiConversation();
  const [activeTab, setActiveTab] = useState<"chat" | "grounding">("chat");
  const [draft, setDraft] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(
    PROMPT_CATEGORIES[0]?.title ?? "",
  );
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const submit = (question: string) => {
    ask(question);
    setDraft("");
  };

  const handleExportTranscript = () => {
    if (turns.length === 0) return;
    const lines = [
      `MEDORA MEDICINE INTELLIGENCE ASSISTANT TRANSCRIPT`,
      `Generated: ${new Date().toLocaleString()}`,
      `---------------------------------------------------\n`,
    ];
    turns.forEach((t, idx) => {
      lines.push(`[Turn ${idx + 1}]`);
      lines.push(`User: ${t.question}`);
      if (t.envelope) {
        const h = summarise(t.envelope.payload).headline;
        const lead = summarise(t.envelope.payload).lead;
        lines.push(`Assistant: ${h}\n${lead}`);
      }
      lines.push("\n");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medora-consultation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript exported successfully");
  };

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title="Medicine Assistant & Clinical Grounding"
        description="Source-labelled medicine explanations, verified safety rules, and real-time Google Search grounding powered by Gemini 3.7 Flash."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-border bg-muted/60 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "chat"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="size-3.5" /> AI Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("grounding")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "grounding"
                    ? "bg-background text-primary shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="size-3.5 text-primary" /> Live Web Grounding
              </button>
            </div>

            {turns.length > 0 && activeTab === "chat" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTranscript}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Download className="size-3.5" /> Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clear}
                  className="text-destructive hover:bg-destructive/10 h-8 text-xs"
                >
                  <Trash2 className="mr-1.5 size-3.5" /> Clear
                </Button>
              </>
            )}
          </div>
        }
      />

      {activeTab === "grounding" ? (
        <LiveGoogleSearchGrounding
          initialQuery="Latest clinical trials and safety notices on Semaglutide and SGLT2 inhibitors"
          initialContextType="clinical_trial"
        />
      ) : (
        <>
          <SafetyNotice
            title="Not a doctor, pharmacist or prescriber"
            tone="info"
          >
            {ASSISTANT_ROLE_STATEMENT}
          </SafetyNotice>

          {/* Persistent Suggested Prompts Explorer */}
          <div className="surface space-y-3 rounded-2xl border border-border p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" /> Suggested
                Clinical Prompts
              </p>
              <span className="text-[11px] text-muted-foreground">
                Click any prompt to ask
              </span>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-border pb-2.5">
              {PROMPT_CATEGORIES.map((cat) => (
                <button
                  key={cat.title}
                  type="button"
                  onClick={() => setActiveCategory(cat.title)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === cat.title
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>

            {/* Prompts for active category */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PROMPT_CATEGORIES.find(
                (c) => c.title === activeCategory,
              )?.prompts.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:border-primary hover:bg-primary/5 text-left flex items-center gap-1.5 shadow-2xs"
                >
                  <Pill className="size-3 text-primary shrink-0" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Turns */}
          {turns.length > 0 && (
            <div className="space-y-6">
              {turns.map((turn) => (
                <TurnCard
                  key={turn.id}
                  turn={turn}
                  onRetry={retry}
                  onFeedback={setFeedback}
                  onAsk={submit}
                />
              ))}
            </div>
          )}

          <div ref={endRef} />

          <form
            className="sticky bottom-20 z-10 flex items-end gap-2 rounded-xl border-2 border-border bg-background p-2.5 shadow-md md:bottom-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit(draft);
            }}
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit(draft);
                }
              }}
              rows={1}
              placeholder="Ask about a medicine, a symptom, or how Medora compares products…"
              className="min-h-[44px] resize-none border-0 bg-transparent focus-visible:ring-0 text-xs sm:text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !draft.trim()}
              aria-label="Send question"
              className="shrink-0 size-10"
            >
              <Send className="size-4" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Answers are informational only. Medora does not diagnose, prescribe,
            or change a dose — confirm anything clinical with a pharmacist or
            doctor, and use emergency services for anything urgent.
          </p>
        </>
      )}
    </div>
  );
}
