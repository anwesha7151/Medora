/**
 * Stage 1 & 2 of the pipeline: intent detection and structured extraction.
 *
 * Deterministic and inspectable. A live NLU provider can replace this module,
 * but the pipeline contract stays the same: text in, typed intent + entities out.
 */
import { demoMedicines } from "@/data/demo-catalog";
import type { AiCapability } from "./schemas";

export type Intent =
  | "medicine_explanation"
  | "medicine_comparison"
  | "interaction_check"
  | "allergy_check"
  | "symptom_triage"
  | "lab_explanation"
  | "prescription_help"
  | "price_or_stock"
  | "medicine_search"
  | "general_information";

export interface ExtractedEntities {
  medicineIds: string[];
  medicineNames: string[];
  ingredients: string[];
  strength: string | null;
  form: string | null;
  symptoms: string[];
  labPanel: string | null;
  durationDays: number | null;
  supply: "prescription_only" | "over_the_counter" | null;
}

export interface IntentResult {
  intent: Intent;
  capability: AiCapability;
  confidence: number;
  matchedSignals: string[];
  entities: ExtractedEntities;
}

const FORMS = [
  "tablet",
  "capsule",
  "syrup",
  "suspension",
  "injection",
  "cream",
  "drops",
  "inhaler",
];

const SYMPTOM_TERMS = [
  "headache",
  "fever",
  "cough",
  "sore throat",
  "rash",
  "nausea",
  "vomiting",
  "diarrhoea",
  "diarrhea",
  "dizziness",
  "stomach pain",
  "back pain",
  "fatigue",
  "chest pain",
  "shortness of breath",
];

const LAB_PANELS = [
  "cbc",
  "full blood count",
  "lipid",
  "cholesterol",
  "hba1c",
  "thyroid",
  "liver",
  "kidney",
];

const signalGroups: { intent: Intent; terms: string[] }[] = [
  {
    intent: "interaction_check",
    terms: [
      "interact",
      "interaction",
      "together with",
      "safe with",
      "take with",
      "with my",
      " with ",
      "mix",
      "combine",
      "combined with",
      "same time as",
      "along with",
      "blood thinners",
    ],
  },
  {
    intent: "allergy_check",
    terms: [
      "allergy",
      "allergic",
      "penicillin allergy",
      "reaction to",
      "hypersensitivity",
    ],
  },
  {
    intent: "medicine_comparison",
    terms: [
      "compare",
      "comparison",
      "difference between",
      "versus",
      " vs ",
      "alternative to",
      "equivalent",
      "generic alternative",
      "substitute",
      "better between",
    ],
  },
  {
    intent: "price_or_stock",
    terms: [
      "price",
      "cheapest",
      "cost",
      "in stock",
      "available at",
      "discount",
      "lowest cost",
      "how much does",
    ],
  },
  {
    intent: "lab_explanation",
    terms: [
      "lab",
      "blood test",
      "report says",
      "test result",
      "reference range",
      "hba1c",
      "blood glucose",
      "fasting glucose",
      "lipid",
      "cholesterol",
      "cbc",
      "platelet",
      "creatinine",
      "lft",
      "kft",
      "hemoglobin",
    ],
  },
  {
    intent: "prescription_help",
    terms: [
      "prescription",
      "my rx",
      "doctor wrote",
      "handwriting",
      "scan",
      "ocr",
    ],
  },
  {
    intent: "symptom_triage",
    terms: [
      "i feel",
      "i have been",
      "symptom",
      "should i see",
      "hurts",
      "pain for",
      "headache",
      "fever",
      "cough",
      "dizziness",
      "vomiting",
    ],
  },
  {
    intent: "medicine_search",
    terms: [
      "find a",
      "looking for",
      "search for",
      "which medicines contain",
      "list all",
    ],
  },
];

const capabilityForIntent: Record<Intent, AiCapability> = {
  medicine_explanation: "medicine_explanation",
  medicine_comparison: "medicine_comparison",
  interaction_check: "drug_interaction",
  allergy_check: "allergy_check",
  symptom_triage: "symptom_triage",
  lab_explanation: "lab_explanation",
  prescription_help: "prescription_ocr",
  price_or_stock: "medicine_intelligence",
  medicine_search: "natural_language_search",
  general_information: "medicine_intelligence",
};

export function extractEntities(text: string): ExtractedEntities {
  const q = text.toLowerCase();

  const medicineIds: string[] = [];
  const medicineNames: string[] = [];
  const ingredients: string[] = [];

  for (const m of demoMedicines) {
    const brand = m.brandName.toLowerCase();
    const generic = m.genericName.toLowerCase();
    const ingredientHit = m.activeIngredients.find((a) =>
      q.includes(a.name.toLowerCase()),
    );
    if (q.includes(brand) || q.includes(generic) || ingredientHit) {
      if (!medicineIds.includes(m.id)) {
        medicineIds.push(m.id);
        medicineNames.push(m.brandName);
      }
      if (ingredientHit && !ingredients.includes(ingredientHit.name)) {
        ingredients.push(ingredientHit.name);
      }
    }
  }

  const strengthMatch = q.match(/(\d+(?:\.\d+)?)\s?(mg|mcg|g|ml|iu)\b/);
  const form = FORMS.find((f) => q.includes(f)) ?? null;
  const symptoms = SYMPTOM_TERMS.filter((s) => q.includes(s));
  const labPanel = LAB_PANELS.find((p) => q.includes(p)) ?? null;
  const durationMatch = q.match(/(\d+)\s?(day|days|week|weeks)/);
  const durationDays = durationMatch
    ? Number(durationMatch[1]) * (durationMatch[2]!.startsWith("week") ? 7 : 1)
    : null;

  return {
    medicineIds,
    medicineNames,
    ingredients,
    strength: strengthMatch ? `${strengthMatch[1]} ${strengthMatch[2]}` : null,
    form,
    symptoms,
    labPanel,
    durationDays,
    supply: q.includes("over the counter")
      ? "over_the_counter"
      : q.includes("prescription")
        ? "prescription_only"
        : null,
  };
}

export function detectIntent(text: string): IntentResult {
  const q = ` ${text.toLowerCase()} `;
  const entities = extractEntities(text);
  const matchedSignals: string[] = [];

  let intent: Intent = "general_information";
  let score = 0.35;

  for (const group of signalGroups) {
    const hits = group.terms.filter((t) => q.includes(t));
    if (hits.length) {
      matchedSignals.push(
        ...hits.map((h) => `"${h.trim()}" → ${group.intent}`),
      );
      intent = group.intent;
      score = 0.72;
      break;
    }
  }

  if (intent === "interaction_check" && entities.medicineIds.length >= 2)
    score = 0.86;
  if (intent === "general_information" && entities.medicineIds.length === 1) {
    intent = "medicine_explanation";
    matchedSignals.push(`catalogue match → ${entities.medicineNames[0]}`);
    score = 0.82;
  }
  if (intent === "general_information" && entities.medicineIds.length > 1) {
    intent = "medicine_comparison";
    matchedSignals.push("multiple catalogue matches → comparison");
    score = 0.7;
  }
  if (intent === "general_information" && entities.symptoms.length) {
    intent = "symptom_triage";
    matchedSignals.push(`symptom terms → ${entities.symptoms.join(", ")}`);
    score = 0.66;
  }
  if (intent === "medicine_comparison" && entities.medicineIds.length < 2)
    score = 0.55;

  return {
    intent,
    capability: capabilityForIntent[intent],
    confidence: Number(score.toFixed(2)),
    matchedSignals,
    entities,
  };
}

export const intentLabels: Record<Intent, string> = {
  medicine_explanation: "Medicine explanation",
  medicine_comparison: "Medicine comparison",
  interaction_check: "Interaction check",
  allergy_check: "Allergy check",
  symptom_triage: "Symptom routing",
  lab_explanation: "Lab report explanation",
  prescription_help: "Prescription understanding",
  price_or_stock: "Price & stock lookup",
  medicine_search: "Medicine search",
  general_information: "General information",
};
