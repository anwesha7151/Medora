/**
 * Typed AI response schemas.
 *
 * Every AI capability in Medora returns a discriminated `AiResult` wrapped in an
 * `AiEnvelope`. The envelope carries the things a medical product cannot leave
 * implicit: which provider produced it, whether that provider is live or a
 * simulation, how confident the extraction was, which sources back it, what the
 * safety validator did, and how the user can dispute it.
 */

export type AiCapability =
  | "medicine_intelligence"
  | "prescription_ocr"
  | "symptom_triage"
  | "medicine_explanation"
  | "drug_interaction"
  | "allergy_check"
  | "lab_explanation"
  | "medicine_comparison"
  | "patient_summary"
  | "natural_language_search";

export type ProviderMode = "demo" | "live";

/** Where a single fact came from. Rendered as a provenance chip. */
export interface AiSource {
  id: string;
  label: string;
  detail: string;
  kind: "catalogue" | "policy" | "user_input" | "model" | "external";
  /** Live provider record identifier, when one exists. */
  reference?: string;
  updatedAt?: string;
  verified: boolean;
}

export type ConfidenceLevel = "high" | "moderate" | "low" | "unverified";

export interface AiConfidence {
  level: ConfidenceLevel;
  /** 0–1. Derived from retrieval match quality, never from model self-report. */
  score: number;
  rationale: string;
}

export interface SafetyVerdict {
  passed: boolean;
  /** Rules that ran, so the UI can show that validation is not decorative. */
  rulesRun: string[];
  violations: string[];
  redFlags: string[];
  escalate: boolean;
  notice: string;
}

export type PipelineStageName =
  | "intent_detection"
  | "entity_extraction"
  | "provider_selection"
  | "retrieval"
  | "safety_validation"
  | "response_composition";

export interface PipelineStage {
  name: PipelineStageName;
  label: string;
  status: "ok" | "skipped" | "blocked";
  detail: string;
  ms: number;
}

/* ------------------------------ Capabilities ------------------------------ */

export interface MedicineExplanation {
  kind: "medicine_explanation";
  medicine: string;
  activeIngredient: string;
  strength: string;
  form: string;
  information: string;
  warnings: string[];
  commonSideEffects: string[];
  storage?: string;
  supply: "prescription_only" | "over_the_counter" | "unknown";
  safetyNotice: string;
}

export interface SymptomTriage {
  kind: "symptom_triage";
  symptoms: string[];
  /** Never a condition list — routing context only. See safety rules. */
  possibleExplanations: string[];
  followUpQuestions: string[];
  monitoringPlan: { window: string; items: string[] }[];
  redFlags: string[];
  escalation: {
    level: "emergency" | "same_day" | "routine" | "self_monitor";
    action: string;
  };
  disclaimer: string;
}

export interface InteractionReport {
  kind: "interaction_report";
  medicines: string[];
  findings: {
    type:
      | "duplicate_ingredient"
      | "allergy_match"
      | "interaction"
      | "safe"
      | "not_assessed";
    severity:
      "severe" | "moderate" | "minor" | "review" | "information" | "safe";
    title: string;
    detail: string;
    items: string[];
  }[];
  assessedBy: string;
  safetyNotice: string;
}

export interface AllergyReport {
  kind: "allergy_report";
  allergies: string[];
  medicines: string[];
  matches: { allergy: string; medicine: string; basis: string }[];
  safetyNotice: string;
}

export interface OcrExtraction {
  kind: "ocr_extraction";
  documentName: string;
  lines: {
    id: string;
    rawText: string;
    medicine: string | null;
    strength: string | null;
    frequency: string | null;
    confidence: number;
    needsReview: boolean;
  }[];
  prescriber: string | null;
  issuedOn: string | null;
  safetyNotice: string;
}

export interface LabExplanation {
  kind: "lab_explanation";
  panel: string;
  analytes: {
    name: string;
    value: string;
    referenceRange: string;
    flag: "low" | "normal" | "high" | "unknown";
    plainLanguage: string;
  }[];
  whatThisIsNot: string;
  safetyNotice: string;
}

export interface MedicineComparison {
  kind: "medicine_comparison";
  criteria: string[];
  rows: {
    medicine: string;
    activeIngredient: string;
    strength: string;
    form: string;
    supply: string;
    manufacturer: string;
  }[];
  equivalence: string;
  safetyNotice: string;
}

export interface PatientSummary {
  kind: "patient_summary";
  headline: string;
  currentMedicines: string[];
  adherenceNote: string;
  openItems: string[];
  questionsForYourClinician: string[];
  safetyNotice: string;
}

export interface SearchInterpretation {
  kind: "search_interpretation";
  query: string;
  interpretedAs: {
    ingredient: string | null;
    strength: string | null;
    form: string | null;
    supply: "prescription_only" | "over_the_counter" | null;
  };
  matches: { id: string; label: string; why: string }[];
  safetyNotice: string;
}

export interface InformationalAnswer {
  kind: "informational_answer";
  headline: string;
  body: string;
  bullets: { label: string; value: string }[];
  safetyNotice: string;
}

export interface EscalationNotice {
  kind: "escalation";
  headline: string;
  body: string;
  triggeredBy: string[];
  action: string;
}

export interface UnavailableNotice {
  kind: "unavailable";
  headline: string;
  body: string;
  missingCapability: AiCapability;
  whatALiveProviderWouldDo: string;
}

export type AiPayload =
  | MedicineExplanation
  | SymptomTriage
  | InteractionReport
  | AllergyReport
  | OcrExtraction
  | LabExplanation
  | MedicineComparison
  | PatientSummary
  | SearchInterpretation
  | InformationalAnswer
  | EscalationNotice
  | UnavailableNotice;

export interface AiEnvelope<T extends AiPayload = AiPayload> {
  id: string;
  capability: AiCapability;
  createdAt: string;
  providerId: string;
  providerLabel: string;
  mode: ProviderMode;
  /** True when nothing in the payload came from a connected live provider. */
  simulated: boolean;
  payload: T;
  confidence: AiConfidence;
  sources: AiSource[];
  safety: SafetyVerdict;
  followUps: string[];
  trace: PipelineStage[];
}

export type FeedbackValue = "helpful" | "unhelpful" | "reported";

export interface AiFeedback {
  envelopeId: string;
  value: FeedbackValue;
  note?: string;
  at: string;
}
