/**
 * Conversation state machine for the assistant surface.
 *
 * States: idle → thinking (pipeline running) → streaming (lead paragraph is
 * revealed progressively) → complete | error. Retry, feedback, report, clear
 * and persisted history are all handled here so the route stays presentational.
 *
 * Persists history to localStorage safely with hydration race-condition prevention.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { runAssistantPipeline } from "./pipeline";
import { summarise } from "./render";
import type { AiEnvelope, FeedbackValue } from "./schemas";

export type TurnStatus = "thinking" | "streaming" | "complete" | "error";

export interface ConversationTurn {
  id: string;
  question: string;
  status: TurnStatus;
  envelope: AiEnvelope | null;
  streamedText: string;
  error?: string | undefined;
  feedback?: FeedbackValue | undefined;
  timestamp?: number;
}

const STORAGE_KEY = "medora.ai.conversation.v2";
const LEGACY_STORAGE_KEY = "medora.ai.conversation.v1";

const load = (): ConversationTurn[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConversationTurn[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((t) => {
      // If a turn was saved during thinking/streaming when reload occurred, sanitize it cleanly
      if (t.status === "thinking" || t.status === "streaming") {
        if (t.envelope) {
          const lead = summarise(t.envelope.payload).lead;
          return {
            ...t,
            status: "complete" as const,
            streamedText: t.streamedText || lead,
            timestamp: t.timestamp || Date.now(),
          };
        }
        return {
          ...t,
          status: "error" as const,
          error:
            "Conversation interrupted by browser reload. You can retry anytime.",
          timestamp: t.timestamp || Date.now(),
        };
      }
      return {
        ...t,
        timestamp: t.timestamp || Date.now(),
      };
    });
  } catch (err) {
    console.warn("[Medora AI] Error restoring conversation history:", err);
    return [];
  }
};

export function useAiConversation() {
  // Synchronous initialization prevents hydration layout popping and prompt race conditions
  const [turns, setTurns] = useState<ConversationTurn[]>(() => load());
  const [hydrated, setHydrated] = useState(false);
  const streamTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setHydrated(true);
    return () => {
      streamTimers.current.forEach(clearTimeout);
    };
  }, []);

  // Persist turns to localStorage
  useEffect(() => {
    if (!hydrated && typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(turns.slice(-40)),
      );
    } catch {
      /* storage full or unavailable — history is best-effort */
    }
  }, [turns, hydrated]);

  const patch = useCallback((id: string, next: Partial<ConversationTurn>) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...next } : t)));
  }, []);

  const stream = useCallback(
    (id: string, envelope: AiEnvelope) => {
      const { lead } = summarise(envelope.payload);
      const words = lead.split(" ");
      patch(id, { status: "streaming", envelope, streamedText: "" });
      words.forEach((word, i) => {
        const timer = setTimeout(
          () => {
            patch(id, {
              streamedText: words.slice(0, i + 1).join(" "),
              ...(i === words.length - 1
                ? { status: "complete" as const }
                : {}),
            });
          },
          18 * (i + 1),
        );
        streamTimers.current.push(timer);
      });
      if (words.length === 0)
        patch(id, { status: "complete", streamedText: lead });
    },
    [patch],
  );

  const execute = useCallback(
    async (id: string, question: string) => {
      patch(id, {
        status: "thinking",
        error: undefined,
        streamedText: "",
        envelope: null,
      });
      try {
        const envelope = await runAssistantPipeline(question);
        stream(id, envelope);
      } catch (error) {
        patch(id, {
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "The AI pipeline failed before producing a response.",
        });
      }
    },
    [patch, stream],
  );

  const ask = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const id = `turn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setTurns((prev) => [
        ...prev,
        {
          id,
          question: trimmed,
          status: "thinking",
          envelope: null,
          streamedText: "",
          timestamp: Date.now(),
        },
      ]);
      void execute(id, trimmed);
    },
    [execute],
  );

  const retry = useCallback(
    (id: string) => {
      const turn = turns.find((t) => t.id === id);
      if (turn) void execute(id, turn.question);
    },
    [execute, turns],
  );

  const setFeedback = useCallback(
    (id: string, value: FeedbackValue) => patch(id, { feedback: value }),
    [patch],
  );

  const clear = useCallback(() => {
    streamTimers.current.forEach(clearTimeout);
    streamTimers.current = [];
    setTurns([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const busy = turns.some(
    (t) => t.status === "thinking" || t.status === "streaming",
  );

  return { turns, ask, retry, setFeedback, clear, busy, hydrated };
}
