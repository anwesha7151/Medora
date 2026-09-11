/**
 * Provider registry.
 *
 * Register a live adapter here (an LLM, an OCR service, a drug database) and the
 * whole AI layer switches over: the pipeline, the confidence model and the
 * Demo/Simulation labelling all read from this registry, not from the UI.
 */
import type { AiCapability } from "./schemas";
import type { MedoraAiProvider } from "./provider-types";
import { demoAiProvider } from "./providers/demo";
import { liveGeminiProvider } from "./providers/gemini";

const registry: MedoraAiProvider[] = [liveGeminiProvider, demoAiProvider];

/** Add a live adapter at runtime (e.g. after credentials are configured). */
export function registerAiProvider(provider: MedoraAiProvider) {
  const existing = registry.findIndex((p) => p.id === provider.id);
  if (existing >= 0) registry.splice(existing, 1, provider);
  else registry.unshift(provider);
}

/** Live providers win; the demo adapter is the always-present fallback. */
export function resolveProvider(capability: AiCapability): MedoraAiProvider {
  return (
    registry.find(
      (p) => p.mode === "live" && p.capabilities.includes(capability),
    ) ??
    registry.find((p) => p.capabilities.includes(capability)) ??
    demoAiProvider
  );
}

export const listProviders = () => [...registry];

export const capabilityLabels: Record<AiCapability, string> = {
  medicine_intelligence: "Medicine intelligence",
  prescription_ocr: "Prescription OCR",
  symptom_triage: "Symptom triage",
  medicine_explanation: "Medicine explanation",
  drug_interaction: "Drug interaction checking",
  allergy_check: "Allergy checking",
  lab_explanation: "Lab report explanation",
  medicine_comparison: "Medicine comparison",
  patient_summary: "Patient summary",
  natural_language_search: "Natural-language search",
};

export interface CapabilityStatus {
  capability: AiCapability;
  label: string;
  providerId: string;
  providerLabel: string;
  mode: "demo" | "live";
  description: string;
}

export const capabilityStatuses = (): CapabilityStatus[] =>
  (Object.keys(capabilityLabels) as AiCapability[]).map((capability) => {
    const provider = resolveProvider(capability);
    return {
      capability,
      label: capabilityLabels[capability],
      providerId: provider.id,
      providerLabel: provider.label,
      mode: provider.mode,
      description: provider.description,
    };
  });
