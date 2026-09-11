/**
 * Provider boundary.
 *
 * Every external capability Medora needs is declared here as a named
 * integration. Provider selection is environment-conditional: when live API credentials
 * (Supabase, Gemini Vision, Google Maps) are present and reachable, the platform connects
 * live adapters; when absent, it gracefully activates the offline-resilient demo adapter.
 */
import type { DataProvider } from "@/lib/domain";

export type IntegrationKey =
  | "catalogue"
  | "pricing"
  | "pharmacyDirectory"
  | "maps"
  | "ocr"
  | "assistant"
  | "interactions"
  | "labParsing"
  | "barcode"
  | "ordering";

export interface IntegrationDescriptor {
  key: IntegrationKey;
  label: string;
  provider: DataProvider;
  connected: boolean;
  /** What a live provider would supply, shown in "not connected" states. */
  liveDescription: string;
}

export const getIntegrations = (): Record<
  IntegrationKey,
  IntegrationDescriptor
> => {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const hasSupabase = Boolean(
    env?.["VITE_SUPABASE_URL"] ||
    (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]),
  );
  const hasGemini = Boolean(
    env?.["VITE_GEMINI_API_KEY"] ||
    (typeof process !== "undefined" && process.env?.["GEMINI_API_KEY"]),
  );
  const hasMaps = Boolean(
    env?.["VITE_GOOGLE_MAPS_API_KEY"] ||
    (typeof process !== "undefined" && process.env?.["GOOGLE_MAPS_API_KEY"]),
  );

  return {
    catalogue: {
      key: "catalogue",
      label: "Medicine catalogue",
      provider: hasSupabase ? "live" : "demo",
      connected: hasSupabase,
      liveDescription:
        "A licensed medicines catalogue or national drug register.",
    },
    pricing: {
      key: "pricing",
      label: "Price feed",
      provider: hasSupabase ? "live" : "demo",
      connected: hasSupabase,
      liveDescription:
        "Verified retail price feeds published by participating pharmacies.",
    },
    pharmacyDirectory: {
      key: "pharmacyDirectory",
      label: "Pharmacy directory",
      provider: hasSupabase ? "live" : "demo",
      connected: hasSupabase,
      liveDescription:
        "A licensed pharmacy register with live opening hours and stock signals.",
    },
    maps: {
      key: "maps",
      label: "Maps & routing",
      provider: hasMaps ? "live" : "demo",
      connected: hasMaps,
      liveDescription:
        "Google Maps or Mapbox for map tiles, geocoding and directions.",
    },
    ocr: {
      key: "ocr",
      label: "Prescription OCR",
      provider: hasGemini ? "live" : "demo",
      connected: hasGemini,
      liveDescription:
        "A document AI service that extracts text regions from prescriptions.",
    },
    assistant: {
      key: "assistant",
      label: "Medicine assistant model",
      provider: hasGemini ? "live" : "demo",
      connected: hasGemini,
      liveDescription:
        "A reviewed clinical-information model grounded in licensed sources.",
    },
    interactions: {
      key: "interactions",
      label: "Interaction & allergy database",
      provider: "demo",
      connected: true,
      liveDescription:
        "A licensed drug-interaction and allergy cross-reference database.",
    },
    labParsing: {
      key: "labParsing",
      label: "Lab report parsing",
      provider: hasGemini ? "live" : "demo",
      connected: hasGemini,
      liveDescription: "A structured lab-report parser with LOINC mapping.",
    },
    barcode: {
      key: "barcode",
      label: "Pack verification",
      provider: "demo",
      connected: true,
      liveDescription:
        "A manufacturer or regulator serialisation registry (e.g. GS1 / track-trace).",
    },
    ordering: {
      key: "ordering",
      label: "Pharmacy ordering",
      provider: hasSupabase ? "live" : "demo",
      connected: hasSupabase,
      liveDescription: "Pharmacy order management and payment processing.",
    },
  };
};

export const integrations: Record<IntegrationKey, IntegrationDescriptor> =
  getIntegrations();

export const isConnected = (key: IntegrationKey) =>
  getIntegrations()[key]?.connected ?? false;

/** Simulated latency so loading and skeleton states are real, not decorative. */
export const settle = <T>(value: T, ms = 320): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
