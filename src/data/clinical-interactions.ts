/**
 * Clinical interaction, side-effect, and pharmacological comparison database.
 * Provides deterministic safety evaluations, drug-drug compatibility matrix,
 * food/lifestyle cautions, organ precautions, and side-effect categorizations.
 */

export interface DrugSafetyProfile {
  id: string;
  name: string;
  genericName: string;
  brandAliases: string[];
  drugClass: string;
  activeIngredients: { name: string; strength: string }[];
  form: string;
  pregnancyCategory: "A" | "B" | "C" | "D" | "X";
  pregnancyNote: string;
  lactationSafety: "Compatible" | "Caution" | "Avoid";
  hepaticPrecaution: "Low" | "Moderate" | "High";
  renalAdjustment: string;
  commonSideEffects: {
    system: "GI" | "CNS" | "Cardio" | "Derma" | "Respiratory" | "Metabolic";
    effect: string;
    frequency: "Very Common (>10%)" | "Common (1-10%)" | "Infrequent (<1%)";
  }[];
  blackBoxWarning?: string;
  foodInteractions: string[];
  lifestyleCautions: string[];
  mechanism: string;
  eliminationHalfLife: string;
  prescriptionOnly: boolean;
}

export interface DrugInteractionRule {
  id: string;
  drugs: [string, string]; // Generic or drug class names in lowercase
  severity: "severe" | "moderate" | "minor";
  title: string;
  mechanism: string;
  clinicalAdvice: string;
  evidenceLevel: "Established" | "Probable" | "Suspected";
}

export const DRUG_SAFETY_DATABASE: Record<string, DrugSafetyProfile> = {
  paracetamol: {
    id: "paracetamol",
    name: "Paracetamol (Acetaminophen)",
    genericName: "Paracetamol",
    brandAliases: [
      "Panacet 500",
      "Feverol",
      "Rezolve P",
      "Tylenol",
      "Panadol",
      "Calpol",
    ],
    drugClass: "Non-opioid Analgesic & Antipyretic",
    activeIngredients: [{ name: "Paracetamol", strength: "500 mg" }],
    form: "Tablet / Syrup",
    pregnancyCategory: "B",
    pregnancyNote:
      "Generally considered safe at standard therapeutic doses across all trimesters.",
    lactationSafety: "Compatible",
    hepaticPrecaution: "High",
    renalAdjustment:
      "Extend dosing interval to every 6-8 hours if GFR < 30 mL/min.",
    commonSideEffects: [
      {
        system: "GI",
        effect: "Mild nausea, epigastric discomfort",
        frequency: "Common (1-10%)",
      },
      {
        system: "Derma",
        effect: "Allergic skin rash, urticaria",
        frequency: "Infrequent (<1%)",
      },
      {
        system: "Metabolic",
        effect:
          "Elevated liver enzymes (transaminases) on prolonged high doses",
        frequency: "Infrequent (<1%)",
      },
    ],
    blackBoxWarning:
      "Hepatotoxicity: Total daily dose must not exceed 4,000 mg in adults (2,000–3,000 mg in chronic liver disease or malnutrition).",
    foodInteractions: [
      "Alcohol increases the risk of acute hepatotoxicity and liver injury.",
    ],
    lifestyleCautions: [
      "Avoid taking multiple combination cold/flu medicines containing paracetamol simultaneously.",
    ],
    mechanism:
      "Inhibits central prostaglandin synthesis (COX-3 / peroxidase site) and modulates cannabinoid pathways.",
    eliminationHalfLife: "2 to 3 hours",
    prescriptionOnly: false,
  },
  ibuprofen: {
    id: "ibuprofen",
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    brandAliases: ["Ibulief 400", "Brufen", "Advil", "Motrin", "Nurofen"],
    drugClass: "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
    activeIngredients: [{ name: "Ibuprofen", strength: "400 mg" }],
    form: "Tablet / Gel",
    pregnancyCategory: "D",
    pregnancyNote:
      "Avoid during the 3rd trimester due to premature closure of ductus arteriosus and oligohydramnios.",
    lactationSafety: "Compatible",
    hepaticPrecaution: "Moderate",
    renalAdjustment:
      "Avoid in severe renal impairment (GFR < 30 mL/min); reduces renal blood flow.",
    commonSideEffects: [
      {
        system: "GI",
        effect: "Dyspepsia, heartburn, gastric ulceration",
        frequency: "Very Common (>10%)",
      },
      {
        system: "Cardio",
        effect: "Fluid retention, mild hypertension",
        frequency: "Common (1-10%)",
      },
      {
        system: "CNS",
        effect: "Headache, dizziness",
        frequency: "Common (1-10%)",
      },
    ],
    blackBoxWarning:
      "Cardiovascular and GI Risk: NSAIDs may cause an increased risk of serious cardiovascular thrombotic events, myocardial infarction, stroke, and gastrointestinal bleeding or ulceration.",
    foodInteractions: [
      "Take with or immediately after food or milk to reduce gastric irritation.",
    ],
    lifestyleCautions: [
      "Limit alcohol consumption as it synergistically compounds gastric mucosal erosion.",
    ],
    mechanism:
      "Non-selective inhibition of cyclooxygenase enzymes (COX-1 and COX-2), reducing pro-inflammatory prostaglandins.",
    eliminationHalfLife: "1.8 to 2 hours",
    prescriptionOnly: false,
  },
  metformin: {
    id: "metformin",
    name: "Metformin Hydrochloride",
    genericName: "Metformin Hydrochloride",
    brandAliases: ["Glucomet 500", "Metfora SR", "Glucophage", "Fortamet"],
    drugClass: "Biguanide Antihyperglycemic",
    activeIngredients: [
      { name: "Metformin Hydrochloride", strength: "500 mg" },
    ],
    form: "Tablet (IR/ER)",
    pregnancyCategory: "B",
    pregnancyNote:
      "Safe and widely used in gestational diabetes under specialist supervision.",
    lactationSafety: "Compatible",
    hepaticPrecaution: "Moderate",
    renalAdjustment:
      "Contraindicated if eGFR < 30 mL/min; maximum 1,000 mg/day if eGFR 30–44 mL/min.",
    commonSideEffects: [
      {
        system: "GI",
        effect: "Diarrhoea, abdominal cramps, flatulence, metallic taste",
        frequency: "Very Common (>10%)",
      },
      {
        system: "Metabolic",
        effect: "Vitamin B12 deficiency with long-term therapy",
        frequency: "Common (1-10%)",
      },
      {
        system: "Metabolic",
        effect: "Lactic acidosis (extremely rare but severe emergency)",
        frequency: "Infrequent (<1%)",
      },
    ],
    blackBoxWarning:
      "Lactic Acidosis: Rare but life-threatening accumulation in patients with acute renal impairment, hypoxemia, or shock.",
    foodInteractions: [
      "Take with meals to minimise gastrointestinal side effects.",
    ],
    lifestyleCautions: [
      "Avoid acute or excessive alcohol intake as it potentiates metformin's effect on lactate metabolism.",
    ],
    mechanism:
      "Activates AMP-activated protein kinase (AMPK), suppresses hepatic gluconeogenesis and enhances peripheral insulin sensitivity.",
    eliminationHalfLife: "6.2 hours (plasma)",
    prescriptionOnly: true,
  },
  amoxicillin: {
    id: "amoxicillin",
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    brandAliases: [
      "Amoxil-C 500",
      "Moxigen 500",
      "Amoxil",
      "Augmentin (component)",
    ],
    drugClass: "Aminopenicillin Beta-Lactam Antibiotic",
    activeIngredients: [{ name: "Amoxicillin", strength: "500 mg" }],
    form: "Capsule / Suspension",
    pregnancyCategory: "B",
    pregnancyNote:
      "Widely prescribed in pregnancy with no documented teratogenic risk.",
    lactationSafety: "Compatible",
    hepaticPrecaution: "Low",
    renalAdjustment:
      "If GFR 10–30 mL/min: max 500 mg every 12 hours. If GFR < 10: 500 mg every 24 hours.",
    commonSideEffects: [
      {
        system: "GI",
        effect: "Loose stools, mild diarrhoea, nausea",
        frequency: "Common (1-10%)",
      },
      {
        system: "Derma",
        effect:
          "Maculopapular rash, pruritus (high incidence in mononucleosis)",
        frequency: "Common (1-10%)",
      },
      {
        system: "Derma",
        effect: "Anaphylaxis or angioedema in penicillin-allergic patients",
        frequency: "Infrequent (<1%)",
      },
    ],
    foodInteractions: [
      "Can be taken without regard to meals; food does not significantly alter total absorption.",
    ],
    lifestyleCautions: [
      "Complete full prescribed course even if symptoms resolve early to prevent resistant bacterial growth.",
    ],
    mechanism:
      "Binds to penicillin-binding proteins (PBPs), inhibiting bacterial cell wall peptidoglycan synthesis leading to cell lysis.",
    eliminationHalfLife: "1 to 1.5 hours",
    prescriptionOnly: true,
  },
  cetirizine: {
    id: "cetirizine",
    name: "Cetirizine Hydrochloride",
    genericName: "Cetirizine Hydrochloride",
    brandAliases: ["Zyracet 10", "Allerclear", "Zyrtec", "Reactine"],
    drugClass: "Second-Generation H1 Antihistamine",
    activeIngredients: [
      { name: "Cetirizine Hydrochloride", strength: "10 mg" },
    ],
    form: "Tablet / Drops",
    pregnancyCategory: "B",
    pregnancyNote:
      "Preferred second-generation antihistamine during pregnancy when clinically indicated.",
    lactationSafety: "Compatible",
    hepaticPrecaution: "Low",
    renalAdjustment:
      "Reduce dose to 5 mg once daily in moderate-to-severe renal impairment (CrCl < 50 mL/min).",
    commonSideEffects: [
      {
        system: "CNS",
        effect: "Mild somnolence / drowsiness, fatigue",
        frequency: "Common (1-10%)",
      },
      {
        system: "GI",
        effect: "Dry mouth (xerostomia), pharyngitis",
        frequency: "Common (1-10%)",
      },
      {
        system: "CNS",
        effect: "Headache, dizziness",
        frequency: "Common (1-10%)",
      },
    ],
    foodInteractions: [
      "Absorption rate is slightly decreased by food, but total bioavailability is unchanged.",
    ],
    lifestyleCautions: [
      "Avoid co-ingestion with alcohol or central nervous system sedatives.",
    ],
    mechanism:
      "Selective peripheral H1 histamine receptor antagonist with minimal central blood-brain barrier penetration.",
    eliminationHalfLife: "8.3 hours",
    prescriptionOnly: false,
  },
  salbutamol: {
    id: "salbutamol",
    name: "Salbutamol (Albuterol)",
    genericName: "Salbutamol",
    brandAliases: ["Bronchaire 100", "Ventolin", "ProAir", "Asthalin"],
    drugClass: "Short-Acting Beta-2 Agonist (SABA) Bronchodilator",
    activeIngredients: [{ name: "Salbutamol", strength: "100 mcg/dose" }],
    form: "Metered Dose Inhaler",
    pregnancyCategory: "C",
    pregnancyNote:
      "Benefit of treating acute maternal bronchospasm outweighs potential theoretical risk.",
    lactationSafety: "Compatible",
    hepaticPrecaution: "Low",
    renalAdjustment:
      "No dose adjustment required for inhaled aerosol delivery.",
    commonSideEffects: [
      {
        system: "Cardio",
        effect: "Sinus tachycardia, palpitations, vasodilation",
        frequency: "Common (1-10%)",
      },
      {
        system: "CNS",
        effect: "Fine skeletal muscle tremor (especially hands), nervousness",
        frequency: "Common (1-10%)",
      },
      {
        system: "Metabolic",
        effect: "Hypokalemia at high doses",
        frequency: "Infrequent (<1%)",
      },
    ],
    foodInteractions: [
      "Excessive dietary caffeine may augment sympathomimetic palpitations.",
    ],
    lifestyleCautions: [
      "Always keep inhaler accessible; rinse mouth after use if combined with inhaled corticosteroids.",
    ],
    mechanism:
      "Stimulates adenylate cyclase via beta-2 adrenergic receptors, relaxing bronchial smooth muscle.",
    eliminationHalfLife: "3.8 to 6 hours",
    prescriptionOnly: true,
  },
  atorvastatin: {
    id: "atorvastatin",
    name: "Atorvastatin Calcium",
    genericName: "Atorvastatin Calcium",
    brandAliases: ["Lipitor", "Atorva", "Storvas", "Lipicure"],
    drugClass: "HMG-CoA Reductase Inhibitor (Statin)",
    activeIngredients: [{ name: "Atorvastatin", strength: "20 mg" }],
    form: "Tablet",
    pregnancyCategory: "X",
    pregnancyNote:
      "Strictly contraindicated in pregnancy; cholesterol synthesis is essential for fetal development.",
    lactationSafety: "Avoid",
    hepaticPrecaution: "High",
    renalAdjustment: "No dosage adjustment needed in renal disease.",
    commonSideEffects: [
      {
        system: "Metabolic",
        effect: "Myalgia, muscle aches, mild creatine kinase elevation",
        frequency: "Common (1-10%)",
      },
      {
        system: "GI",
        effect: "Diarrhoea, dyspepsia, constipation",
        frequency: "Common (1-10%)",
      },
      {
        system: "Metabolic",
        effect: "Rhabdomyolysis with dark urine (acute emergency)",
        frequency: "Infrequent (<1%)",
      },
    ],
    blackBoxWarning:
      "Liver Disease: Contraindicated in active liver disease or unexplained persistent elevations of transaminases.",
    foodInteractions: [
      "Avoid large quantities (>1 litre/day) of grapefruit juice (CYP3A4 inhibitor).",
    ],
    lifestyleCautions: [
      "Report unexplained muscle tenderness, weakness or brown urine immediately.",
    ],
    mechanism:
      "Competitive inhibition of 3-hydroxy-3-methylglutaryl-coenzyme A (HMG-CoA) reductase, upregulating LDL receptors.",
    eliminationHalfLife: "14 hours (active metabolites 20-30 hours)",
    prescriptionOnly: true,
  },
  aspirin: {
    id: "aspirin",
    name: "Aspirin (Acetylsalicylic Acid)",
    genericName: "Aspirin",
    brandAliases: ["Ecosprin", "Disprin", "Bayer Aspirin", "Cardiprin"],
    drugClass: "Antiplatelet & Salicylate NSAID",
    activeIngredients: [{ name: "Aspirin", strength: "75 mg" }],
    form: "Tablet (Enteric Coated)",
    pregnancyCategory: "D",
    pregnancyNote:
      "Low-dose (75-150 mg) may be indicated for preeclampsia prevention; full doses avoided in 3rd trimester.",
    lactationSafety: "Caution",
    hepaticPrecaution: "Moderate",
    renalAdjustment: "Avoid in severe renal impairment (GFR < 10 mL/min).",
    commonSideEffects: [
      {
        system: "GI",
        effect: "Gastric erosion, micro-bleeding, nausea",
        frequency: "Common (1-10%)",
      },
      {
        system: "Cardio",
        effect: "Prolonged bleeding time, easy bruising",
        frequency: "Common (1-10%)",
      },
      {
        system: "Respiratory",
        effect: "Bronchospasm in aspirin-sensitive asthmatics",
        frequency: "Infrequent (<1%)",
      },
    ],
    blackBoxWarning:
      "Reye Syndrome: Do not administer to children or adolescents with viral infections (influenza/chickenpox).",
    foodInteractions: [
      "Take with a glass of water after meals to protect gastric lining.",
    ],
    lifestyleCautions: [
      "Inform dentists and surgeons of aspirin use at least 7 days prior to elective procedures.",
    ],
    mechanism:
      "Irreversible acetylation of platelet COX-1, permanently inhibiting thromboxane A2 (TXA2) for platelet lifespan (7-10 days).",
    eliminationHalfLife:
      "15 to 20 minutes (aspirin); 2 to 30 hours for salicylate metabolite.",
    prescriptionOnly: false,
  },
};

export const DRUG_INTERACTION_RULES: DrugInteractionRule[] = [
  {
    id: "rule-nsaid-aspirin",
    drugs: ["ibuprofen", "aspirin"],
    severity: "severe",
    title:
      "NSAID + Low-dose Aspirin: Diminished Cardioprotection & Synergistic Bleeding",
    mechanism:
      "Ibuprofen competitively binds to platelet COX-1, preventing irreversible acetylation by aspirin, neutralizing its cardioprotective antiplatelet effect, while compounding GI mucosal ulceration risk.",
    clinicalAdvice:
      "If both are necessary, take immediate-release aspirin at least 30 minutes before or 8 hours after ibuprofen. Consult your physician for safer alternatives.",
    evidenceLevel: "Established",
  },
  {
    id: "rule-nsaid-paracetamol-duplicate",
    drugs: ["paracetamol", "paracetamol"],
    severity: "severe",
    title: "Duplicate Active Ingredient: Paracetamol Toxicity Overload",
    mechanism:
      "Concurrent use of multiple paracetamol-containing products saturates the glutathione conjugation pathway, leading to toxic NAPQI metabolite accumulation and acute centrilobular hepatic necrosis.",
    clinicalAdvice:
      "Discontinue all duplicate paracetamol formulations immediately. Check combination cold/cough products for hidden paracetamol.",
    evidenceLevel: "Established",
  },
  {
    id: "rule-metformin-contrast-nsaid",
    drugs: ["metformin", "ibuprofen"],
    severity: "moderate",
    title:
      "Metformin + NSAID: Enhanced Risk of Renal Impairment & Lactic Acidosis",
    mechanism:
      "NSAIDs inhibit renal prostaglandins, reducing glomerular filtration rate. Diminished renal excretion of metformin increases plasma concentrations and theoretical lactic acidosis susceptibility.",
    clinicalAdvice:
      "Monitor renal function (eGFR/serum creatinine) and maintain adequate hydration. Avoid chronic high-dose NSAID co-administration.",
    evidenceLevel: "Probable",
  },
  {
    id: "rule-atorvastatin-clarithro",
    drugs: ["atorvastatin", "amoxicillin"],
    severity: "minor",
    title: "Atorvastatin + Antibiotic Therapy: Routine Observation",
    mechanism:
      "Amoxicillin does not inhibit CYP3A4 significantly. Unlike macrolides (e.g. clarithromycin), this combination is generally well tolerated with low risk of elevated statin exposure.",
    clinicalAdvice:
      "Safe to take concurrently. Report any new or unexpected generalized muscle soreness.",
    evidenceLevel: "Established",
  },
  {
    id: "rule-cetirizine-salbutamol",
    drugs: ["cetirizine", "salbutamol"],
    severity: "minor",
    title: "Antihistamine + Beta-2 Agonist: Safe Bronchial Co-management",
    mechanism:
      "Complimentary mechanisms without antagonistic pharmacodynamic pathways. Useful in allergic rhinitis and allergic asthma overlap.",
    clinicalAdvice: "Compatible. Maintain your prescribed dosing interval.",
    evidenceLevel: "Established",
  },
  {
    id: "rule-aspirin-metformin",
    drugs: ["aspirin", "metformin"],
    severity: "minor",
    title: "Aspirin + Metformin: Mild Hypoglycemic Potentiation",
    mechanism:
      "High doses of salicylates can exert mild intrinsic hypoglycemic actions. Low-dose cardioprotective aspirin rarely affects glycemic control.",
    clinicalAdvice:
      "Standard cardiovascular prophylaxis dosage (75–100 mg) is safe with routine blood glucose monitoring.",
    evidenceLevel: "Probable",
  },
];

/** Helper to match a query string to a drug profile */
export function findDrugProfile(query: string): DrugSafetyProfile | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  for (const [key, profile] of Object.entries(DRUG_SAFETY_DATABASE)) {
    if (
      key === q ||
      profile.name.toLowerCase().includes(q) ||
      profile.genericName.toLowerCase().includes(q) ||
      profile.brandAliases.some((b) => b.toLowerCase().includes(q)) ||
      profile.activeIngredients.some((a) => a.name.toLowerCase().includes(q))
    ) {
      return profile;
    }
  }

  // Fallback profile if not in dedicated database but exists in catalogue
  return {
    id: q.replace(/\s+/g, "-"),
    name: query,
    genericName: query,
    brandAliases: [query],
    drugClass: "Therapeutic Agent",
    activeIngredients: [{ name: query, strength: "Standard" }],
    form: "Tablet",
    pregnancyCategory: "C",
    pregnancyNote:
      "Consult your obstetrician or pharmacist before taking during pregnancy.",
    lactationSafety: "Caution",
    hepaticPrecaution: "Moderate",
    renalAdjustment: "Discuss with clinician if renal function is impaired.",
    commonSideEffects: [
      {
        system: "GI",
        effect: "Mild gastrointestinal upset",
        frequency: "Common (1-10%)",
      },
      {
        system: "CNS",
        effect: "Mild headache or fatigue",
        frequency: "Infrequent (<1%)",
      },
    ],
    foodInteractions: [
      "Take with a full glass of water. Review packaging for food requirements.",
    ],
    lifestyleCautions: [
      "Do not discontinue prescribed treatment without clinical supervision.",
    ],
    mechanism:
      "Therapeutic agent acting on physiological targets. Detailed pharmacology available upon provider query.",
    eliminationHalfLife: "Variable",
    prescriptionOnly: false,
  };
}

/** Analyze interaction between a list of medicine strings */
export function analyzeDrugList(
  medicineNames: string[],
  allergies: string[] = [],
): {
  profiles: DrugSafetyProfile[];
  interactions: DrugInteractionRule[];
  duplicateIngredients: { ingredient: string; medicines: string[] }[];
  allergyWarnings: { allergy: string; matchedMedicine: string }[];
  safetyScore: number; // 0 to 100
} {
  const profiles = medicineNames
    .map((name) => findDrugProfile(name))
    .filter((p): p is DrugSafetyProfile => p !== null);

  const interactions: DrugInteractionRule[] = [];
  const duplicateIngredients: { ingredient: string; medicines: string[] }[] =
    [];
  const allergyWarnings: { allergy: string; matchedMedicine: string }[] = [];

  // 1. Check drug-drug interactions
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const p1 = profiles[i]!;
      const p2 = profiles[j]!;

      // Check predefined rules
      const rule = DRUG_INTERACTION_RULES.find((r) => {
        const [d1, d2] = r.drugs;
        const matches1 =
          p1.id === d1 ||
          p1.genericName.toLowerCase().includes(d1) ||
          p1.name.toLowerCase().includes(d1);
        const matches2 =
          p2.id === d2 ||
          p2.genericName.toLowerCase().includes(d2) ||
          p2.name.toLowerCase().includes(d2);

        const rev1 =
          p1.id === d2 ||
          p1.genericName.toLowerCase().includes(d2) ||
          p1.name.toLowerCase().includes(d2);
        const rev2 =
          p2.id === d1 ||
          p2.genericName.toLowerCase().includes(d1) ||
          p2.name.toLowerCase().includes(d1);

        return (matches1 && matches2) || (rev1 && rev2);
      });

      if (rule) {
        interactions.push(rule);
      }
    }
  }

  // 2. Check duplicate ingredients
  const ingredientMap = new Map<string, string[]>();
  profiles.forEach((p) => {
    p.activeIngredients.forEach((a) => {
      const key = a.name.toLowerCase();
      const existing = ingredientMap.get(key) ?? [];
      existing.push(p.name);
      ingredientMap.set(key, existing);
    });
  });

  ingredientMap.forEach((meds, ing) => {
    if (meds.length > 1) {
      duplicateIngredients.push({
        ingredient: ing.charAt(0).toUpperCase() + ing.slice(1),
        medicines: meds,
      });
    }
  });

  // 3. Check allergy matches
  allergies.forEach((allergy) => {
    if (!allergy) return;
    const clean = allergy.toLowerCase().split(" ")[0] ?? allergy.toLowerCase();
    profiles.forEach((p) => {
      const match =
        p.name.toLowerCase().includes(clean) ||
        p.genericName.toLowerCase().includes(clean) ||
        p.drugClass.toLowerCase().includes(clean) ||
        p.activeIngredients.some((a) => a.name.toLowerCase().includes(clean));

      if (match) {
        allergyWarnings.push({
          allergy,
          matchedMedicine: p.name,
        });
      }
    });
  });

  // 4. Calculate safety score (100 is pristine, deduct for severe interactions)
  let score = 100;
  interactions.forEach((i) => {
    if (i.severity === "severe") score -= 35;
    else if (i.severity === "moderate") score -= 15;
    else score -= 5;
  });
  duplicateIngredients.forEach(() => {
    score -= 25;
  });
  allergyWarnings.forEach(() => {
    score -= 40;
  });

  score = Math.max(10, Math.min(100, score));

  return {
    profiles,
    interactions,
    duplicateIngredients,
    allergyWarnings,
    safetyScore: score,
  };
}
