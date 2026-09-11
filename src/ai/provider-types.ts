/**
 * Provider adapter architecture.
 *
 * Every AI capability is defined here as a narrow contract. The demo adapter is
 * one implementation; an LLM, an OCR service, a licensed drug database or an
 * interaction API can be registered later without any UI change, as long as it
 * satisfies the same contract and declares its provenance honestly.
 */
import type {
  AiCapability,
  AiSource,
  AllergyReport,
  InformationalAnswer,
  InteractionReport,
  LabExplanation,
  MedicineComparison,
  MedicineExplanation,
  OcrExtraction,
  PatientSummary,
  ProviderMode,
  SearchInterpretation,
  SymptomTriage,
} from "./schemas";

/** What an adapter returns before the pipeline wraps it in an envelope. */
export interface ProviderOutput<T> {
  payload: T;
  sources: AiSource[];
  /** 0–1 retrieval quality, computed by the adapter from real match evidence. */
  matchScore: number;
  matchRationale: string;
  followUps?: string[];
}

export interface TriageRequest {
  symptoms: string[];
  freeText: string;
  durationDays: number;
  severity: number;
  ageBand?: string;
  pregnancy?: string;
  currentMedicines: string[];
  allergies: string[];
  selectedRedFlags: string[];
}

export interface PatientSummaryRequest {
  currentMedicines: string[];
  allergies: string[];
  adherencePercent: number | null;
  openPrescriptions: number;
  recentEvents: string[];
}

export interface MedoraAiProvider {
  id: string;
  label: string;
  mode: ProviderMode;
  /** Capabilities this adapter can actually serve. Others fall back to an honest "unavailable". */
  capabilities: AiCapability[];
  description: string;

  explainMedicine(
    query: string,
  ): Promise<ProviderOutput<MedicineExplanation> | null>;
  answerInformational(
    query: string,
  ): Promise<ProviderOutput<InformationalAnswer>>;
  interpretSearch(query: string): Promise<ProviderOutput<SearchInterpretation>>;
  compareMedicines(
    medicineIds: string[],
  ): Promise<ProviderOutput<MedicineComparison> | null>;
  triage(request: TriageRequest): Promise<ProviderOutput<SymptomTriage>>;
  checkInteractions(
    medicines: string[],
    allergies: string[],
  ): Promise<ProviderOutput<InteractionReport>>;
  checkAllergies(
    medicines: string[],
    allergies: string[],
  ): Promise<ProviderOutput<AllergyReport>>;
  extractPrescription(file: {
    name: string;
    type: string;
  }): Promise<ProviderOutput<OcrExtraction>>;
  explainLabReport(
    panel: string,
  ): Promise<ProviderOutput<LabExplanation> | null>;
  summarisePatient(
    request: PatientSummaryRequest,
  ): Promise<ProviderOutput<PatientSummary>>;
}
