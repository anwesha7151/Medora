/**
 * Clinical-support adapters.
 *
 * These are DEMO adapters. They deliberately never produce a diagnosis, a dose,
 * or a claim about a specific interaction. They return structured, source-labelled
 * information derived from the catalogue plus fixed safety guidance, and they
 * escalate red flags. A live adapter must satisfy the same contracts.
 */
import { demoMedicines } from "@/data/demo-catalog";
import type { Medicine } from "@/lib/domain";
import { settle } from "./provider";

export interface SourceChip {
  label: string;
  detail: string;
}

export interface AssistantAnswer {
  headline: string;
  body: string;
  bullets?: { label: string; value: string }[];
  safetyNotes: string[];
  followUps: string[];
  sources: SourceChip[];
  escalate?: boolean;
  medicineId?: string;
}

const catalogueSource = (m: Medicine): SourceChip => ({
  label: `Demo catalogue · ${m.brandName}`,
  detail: `${m.provenance.source}, last updated ${m.provenance.updatedAt}. Sample record, not a live regulatory feed.`,
});

const safetyBase = [
  "Medora is informational. It does not diagnose conditions and never tells you to start, stop or change a medicine.",
  "Confirm anything you act on with a pharmacist or doctor.",
];

export const RED_FLAG_TERMS = [
  "chest pain",
  "difficulty breathing",
  "can't breathe",
  "cannot breathe",
  "shortness of breath",
  "unconscious",
  "fainting",
  "severe bleeding",
  "suicide",
  "stroke",
  "seizure",
  "anaphylaxis",
  "swollen tongue",
  "overdose",
  "blue lips",
];

export const detectRedFlag = (text: string) =>
  RED_FLAG_TERMS.filter((t) => text.toLowerCase().includes(t));

const findMedicine = (text: string) => {
  const q = text.toLowerCase();
  return demoMedicines.find(
    (m) =>
      q.includes(m.brandName.toLowerCase()) ||
      q.includes(m.genericName.toLowerCase()) ||
      m.activeIngredients.some((a) => q.includes(a.name.toLowerCase())),
  );
};

export const askAssistant = async (
  question: string,
): Promise<AssistantAnswer> => {
  const flags = detectRedFlag(question);
  if (flags.length) {
    return settle(
      {
        headline: "This needs urgent professional care",
        body: `Your message mentions ${flags.join(", ")}. Medora cannot assess emergencies. Contact your local emergency number or go to the nearest emergency department now.`,
        safetyNotes: [
          "Do not wait for an answer from this assistant.",
          "If someone is unresponsive or struggling to breathe, call emergency services immediately.",
        ],
        followUps: [],
        sources: [
          {
            label: "Medora safety policy",
            detail:
              "Red-flag routing rule. Emergency wording is fixed and never model-generated.",
          },
        ],
        escalate: true,
      },
      420,
    );
  }

  const medicine = findMedicine(question);
  if (medicine) {
    return settle(
      {
        headline: `${medicine.brandName} (${medicine.genericName})`,
        body: medicine.usesSummary,
        bullets: [
          {
            label: "Active ingredient",
            value: medicine.activeIngredients[0]?.name ?? "—",
          },
          {
            label: "Strength",
            value: medicine.activeIngredients[0]?.strength ?? "—",
          },
          { label: "Dosage form", value: medicine.form },
          { label: "Pack size", value: medicine.packSize },
          { label: "Manufacturer", value: medicine.manufacturer },
          {
            label: "Supply",
            value: medicine.prescriptionOnly
              ? "Prescription-only"
              : "Over the counter",
          },
        ],
        safetyNotes: [...medicine.warnings, ...safetyBase],
        followUps: [
          `What is in ${medicine.brandName}?`,
          `Show equivalent products to ${medicine.brandName}`,
          "How does Medora decide two products are equivalent?",
        ],
        sources: [catalogueSource(medicine)],
        medicineId: medicine.id,
      },
      520,
    );
  }

  return settle(
    {
      headline: "I can only answer from connected sources",
      body: "No connected medical information provider matched that question, and Medora will not generate clinical content from an unverified source. You can search the demo catalogue for a medicine by brand, generic name or active ingredient, or ask about how Medora compares products.",
      safetyNotes: safetyBase,
      followUps: [
        "What is Paracetamol 500 mg used for?",
        "Compare Cetirizine 10 mg products",
        "How does Medora decide two products are equivalent?",
      ],
      sources: [
        {
          label: "Integration not connected",
          detail:
            "A reviewed clinical-information provider is not connected in this environment. Answers are limited to the demo catalogue.",
        },
      ],
    },
    460,
  );
};

/* ---------------------------------- Triage --------------------------------- */

export interface TriageInput {
  symptoms: string[];
  freeText: string;
  durationDays: string;
  severity: number;
  ageBand: string;
  currentMedicines: string[];
  allergies: string[];
  redFlags: string[];
  pregnancy: string;
}

export interface TriageResult {
  urgency: "emergency" | "same_day" | "routine" | "self_monitor";
  headline: string;
  summary: string;
  possibleExplanations: string[];
  monitorFor: string[];
  seekCareIf: string[];
  monitoringPlan: { day: string; items: string[] }[];
  escalate: boolean;
}

export const runTriage = async (input: TriageInput): Promise<TriageResult> => {
  const emergency =
    input.redFlags.length > 0 || detectRedFlag(input.freeText).length > 0;
  if (emergency) {
    return settle({
      urgency: "emergency",
      headline: "Seek emergency care now",
      summary:
        "You selected or described one or more warning signs that Medora routes straight to emergency care. This tool cannot assess them.",
      possibleExplanations: [],
      monitorFor: [],
      seekCareIf: [
        "Immediately — call your local emergency number or go to an emergency department.",
      ],
      monitoringPlan: [],
      escalate: true,
    });
  }

  const days = Number(input.durationDays) || 0;
  const urgency: TriageResult["urgency"] =
    input.severity >= 8 || days > 14
      ? "same_day"
      : input.severity >= 5 || days > 5
        ? "routine"
        : "self_monitor";

  const summary =
    urgency === "same_day"
      ? "Based on the severity and duration you entered, Medora suggests speaking to a clinician today. This is a routing suggestion, not a diagnosis."
      : urgency === "routine"
        ? "Based on what you entered, a non-urgent appointment with a clinician or a pharmacist conversation is reasonable. This is a routing suggestion, not a diagnosis."
        : "What you entered does not match Medora's escalation rules. You can monitor at home and seek care if anything changes. This is a routing suggestion, not a diagnosis.";

  return settle(
    {
      urgency,
      headline:
        urgency === "same_day"
          ? "Speak to a clinician today"
          : urgency === "routine"
            ? "Book a routine appointment"
            : "Monitor at home for now",
      summary,
      possibleExplanations: [
        "Medora does not produce a list of candidate conditions. Naming possible conditions from a symptom form is diagnosis, and this tool is not a diagnostic device.",
        "A clinician can interpret your symptoms alongside your history, examination and, if needed, tests.",
      ],
      monitorFor: [
        "Symptoms getting noticeably worse rather than steady or better",
        "A new symptom appearing that you did not have when you filled this in",
        "Anything on the emergency warning-sign list appearing at any point",
        "Difficulty keeping fluids down, or being unable to do your normal daily activities",
      ],
      seekCareIf: [
        "Any emergency warning sign appears — do not use this tool, seek emergency care",
        `Your symptoms last longer than ${Math.max(days + 2, 3)} days in total without improving`,
        "You are pregnant, immunosuppressed, or managing a long-term condition and feel unwell",
        "You are unsure whether a medicine you already take is affecting how you feel",
      ],
      monitoringPlan: [
        {
          day: "Next 24 hours",
          items: [
            "Write down your symptoms, the time they change, and your temperature if you can measure it",
            "Rest and keep up your normal fluids unless a clinician has told you otherwise",
            "Do not start any new medicine based on this output — ask a pharmacist or doctor first",
          ],
        },
        {
          day: "24–48 hours",
          items: [
            "Compare your notes with yesterday: better, the same, or worse?",
            "If the same or worse, contact a clinician or pharmacist and share your notes",
            "Keep taking any medicine already prescribed to you exactly as your prescriber instructed",
          ],
        },
      ],
      escalate: false,
    },
    700,
  );
};

/* ------------------------ Interactions & allergies ------------------------- */

export interface InteractionFinding {
  kind: "allergy_match" | "duplicate_ingredient" | "not_assessed";
  severity: "review" | "information";
  title: string;
  detail: string;
  items: string[];
}

export const checkInteractions = async (
  medicineNames: string[],
  allergies: string[],
): Promise<InteractionFinding[]> => {
  const findings: InteractionFinding[] = [];

  // Deterministic, explainable checks only — no invented pharmacology.
  const ingredientMap = new Map<string, string[]>();
  medicineNames.forEach((name) => {
    const med = demoMedicines.find(
      (m) =>
        name.toLowerCase().includes(m.brandName.toLowerCase()) ||
        name.toLowerCase().includes(m.genericName.toLowerCase()),
    );
    if (med) {
      med.activeIngredients.forEach((a) => {
        const list = ingredientMap.get(a.name) ?? [];
        list.push(name);
        ingredientMap.set(a.name, list);
      });
    }
  });

  ingredientMap.forEach((names, ingredient) => {
    if (names.length > 1) {
      findings.push({
        kind: "duplicate_ingredient",
        severity: "review",
        title: `Same active ingredient listed more than once: ${ingredient}`,
        detail:
          "Two or more of the entries you listed contain this active ingredient according to the demo catalogue. Taking duplicate ingredients unintentionally is a common cause of harm. Ask a pharmacist to review this list before your next dose.",
        items: names,
      });
    }
  });

  allergies.filter(Boolean).forEach((allergy) => {
    const matches = medicineNames.filter((n) =>
      n
        .toLowerCase()
        .includes(allergy.toLowerCase().split(" ")[0] ?? allergy.toLowerCase()),
    );
    if (matches.length) {
      findings.push({
        kind: "allergy_match",
        severity: "review",
        title: `A recorded allergy matches a listed medicine name: ${allergy}`,
        detail:
          "This is a simple text match against the allergy you recorded, not a clinical allergy assessment. Take it to a pharmacist or your prescriber before taking anything on the list.",
        items: matches,
      });
    }
  });

  findings.push({
    kind: "not_assessed",
    severity: "information",
    title: "Drug–drug interactions were not assessed",
    detail:
      "A licensed interaction database is not connected in this environment, so Medora will not state whether these medicines interact. Inventing that result would be unsafe. Ask a pharmacist to run a full interaction check, or connect an interaction provider.",
    items: medicineNames,
  });

  return settle(findings, 560);
};
