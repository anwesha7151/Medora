import type { AiEnvelope, AiPayload } from "./schemas";

/** Headline + lead text for a payload, used for the streamed lead paragraph. */
export function summarise(payload: AiPayload): {
  headline: string;
  lead: string;
} {
  switch (payload.kind) {
    case "medicine_explanation":
      return { headline: payload.medicine, lead: payload.information };
    case "symptom_triage":
      return { headline: "Symptom routing", lead: payload.escalation.action };
    case "interaction_report":
      return {
        headline: "Interaction & Safety Check",
        lead: `Medora evaluated ${payload.medicines.length || "the"} listed medication(s) across pharmacological interaction databases, active ingredient duplication rules, and safety precautions.`,
      };
    case "allergy_report":
      return {
        headline: "Allergy cross-check",
        lead: payload.matches.length
          ? `${payload.matches.length} name-level match(es) against your recorded allergies.`
          : "No name-level matches against your recorded allergies. That is not a clearance.",
      };
    case "ocr_extraction":
      return {
        headline: `Extracted from ${payload.documentName}`,
        lead: payload.safetyNotice,
      };
    case "lab_explanation":
      return {
        headline: `${payload.panel.toUpperCase()} Clinical Lab Explanation`,
        lead: `Analyte reference ranges and clinical interpretations for ${payload.panel}. Always review lab reports directly with your ordering clinician.`,
      };
    case "medicine_comparison":
      return { headline: "Side-by-side comparison", lead: payload.equivalence };
    case "patient_summary":
      return { headline: payload.headline, lead: payload.adherenceNote };
    case "search_interpretation":
      return {
        headline: "How Medora read your search",
        lead: payload.matches.length
          ? `${payload.matches.length} catalogue record(s) matched.`
          : "No catalogue record matched that search.",
      };
    case "informational_answer":
      return { headline: payload.headline, lead: payload.body };
    case "escalation":
      return { headline: payload.headline, lead: payload.body };
    case "unavailable":
      return { headline: payload.headline, lead: payload.body };
  }
}

export const safetyNoticeOf = (payload: AiPayload): string | null =>
  "safetyNotice" in payload
    ? payload.safetyNotice
    : payload.kind === "symptom_triage"
      ? payload.disclaimer
      : null;

export const confidenceCopy: Record<AiEnvelope["confidence"]["level"], string> =
  {
    high: "High match confidence",
    moderate: "Moderate match confidence",
    low: "Low match confidence",
    unverified: "Unverified",
  };
