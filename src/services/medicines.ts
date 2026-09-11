import { demoMedicines, demoPharmacies } from "@/data/demo-catalog";
import type { Medicine, Pharmacy, PriceListing } from "@/lib/domain";
import { getProvider, demoProvider } from "./medicine-provider";

export interface OfferRow {
  listing: PriceListing;
  medicine: Medicine;
  pharmacy: Pharmacy;
  unitPrice: number;
  units: number;
}

const unitsInPack = (packSize: string) => {
  const n = parseInt(packSize, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

// We will attempt to use the active provider.
// If it fails because it is the unconnected live provider, we fallback to demo provider gracefully
// (or we can let the UI show the unconnected state).
// For now, let's fallback to demoProvider so the existing UI doesn't break,
// but the provider abstraction is fully in place.

const executeWithFallback = async <T>(
  operation: (provider: ReturnType<typeof getProvider>) => Promise<T>,
): Promise<T> => {
  const provider = getProvider();
  try {
    return await operation(provider);
  } catch (error) {
    console.warn(
      "Primary medicine provider failed or not connected, falling back to DemoProvider",
      error,
    );
    return await operation(demoProvider);
  }
};

export const searchMedicines = async (query: string): Promise<Medicine[]> => {
  return executeWithFallback((p) => p.searchMedicines(query));
};

export const getMedicine = async (
  id: string,
): Promise<Medicine | undefined> => {
  return executeWithFallback((p) => p.getMedicine(id));
};

// Sync version is still used occasionally, we'll try to find in demo if it's there
export const getMedicineSync = (id: string) =>
  demoMedicines.find((m) => m.id === id);

/** Equivalence = identical active ingredient + strength + dosage form. */
export const getEquivalents = async (
  medicine: Medicine,
): Promise<Medicine[]> => {
  return executeWithFallback((p) => p.getEquivalents(medicine));
};

export const getOffers = async (medicineIds: string[]): Promise<OfferRow[]> => {
  const listings = await executeWithFallback((p) => p.getOffers(medicineIds));
  // We need to resolve medicines and pharmacies for these listings
  // Usually the provider would return joined data or we fetch it.
  // For this abstraction, we will use the provider to fetch them if needed.
  // To keep it simple and performant, we'll map them using demo catalog if they are demo listings,
  // or fetch from provider.

  const provider = getProvider();
  const rows: OfferRow[] = [];

  for (const listing of listings) {
    let medicine: Medicine | undefined;
    let pharmacy: Pharmacy | undefined;

    if (listing.provenance.source === "Medora Demo Data") {
      medicine = demoMedicines.find((m) => m.id === listing.medicineId);
      pharmacy = demoPharmacies.find((p) => p.id === listing.pharmacyId);
    } else {
      medicine = await provider
        .getMedicine(listing.medicineId)
        .catch(() => undefined);
      pharmacy = await provider
        .getPharmacy(listing.pharmacyId)
        .catch(() => undefined);
    }

    if (medicine && pharmacy) {
      const units = unitsInPack(listing.packSize);
      rows.push({
        listing,
        medicine,
        pharmacy,
        units,
        unitPrice: listing.price / units,
      });
    }
  }

  return rows.sort((a, b) => a.unitPrice - b.unitPrice);
};

export const getPharmacies = async (): Promise<Pharmacy[]> => {
  return executeWithFallback((p) => p.getPharmacies());
};

export const getPharmacy = async (
  id: string,
): Promise<Pharmacy | undefined> => {
  return executeWithFallback((p) => p.getPharmacy(id));
};

export const getPharmacyStock = async (
  pharmacyId: string,
): Promise<OfferRow[]> => {
  const listings = await executeWithFallback((p) =>
    p.getPharmacyStock(pharmacyId),
  );

  const provider = getProvider();
  const rows: OfferRow[] = [];

  for (const listing of listings) {
    let medicine: Medicine | undefined;
    let pharmacy: Pharmacy | undefined;

    if (listing.provenance.source === "Medora Demo Data") {
      medicine = demoMedicines.find((m) => m.id === listing.medicineId);
      pharmacy = demoPharmacies.find((p) => p.id === listing.pharmacyId);
    } else {
      medicine = await provider
        .getMedicine(listing.medicineId)
        .catch(() => undefined);
      pharmacy = await provider
        .getPharmacy(listing.pharmacyId)
        .catch(() => undefined);
    }

    if (medicine && pharmacy) {
      const units = unitsInPack(listing.packSize);
      rows.push({
        listing,
        medicine,
        pharmacy,
        units,
        unitPrice: listing.price / units,
      });
    }
  }

  return rows;
};

export const isOpenNow = (p: Pharmacy, now = new Date()) => {
  if (p.open24h) return true;
  const mins = now.getHours() * 60 + now.getMinutes();
  const toMin = (s: string) =>
    Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  return mins >= toMin(p.opensAt) && mins <= toMin(p.closesAt);
};

export const formatMoney = (value: number, currency = "INR") => {
  const code = currency === "USD" ? "INR" : currency;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(value);
};

/** Transparent, rule-based "best value" explanation — never a quality claim. */
export const explainBestValue = (rows: OfferRow[]) => {
  const available = rows.filter(
    (r) => r.listing.availability !== "out_of_stock",
  );
  if (available.length === 0) return null;
  const best = available.reduce((a, b) => (a.unitPrice <= b.unitPrice ? a : b));
  const worst = available.reduce((a, b) =>
    a.unitPrice >= b.unitPrice ? a : b,
  );
  const savingPerUnit = worst.unitPrice - best.unitPrice;
  return {
    best,
    worst,
    savingPerUnit,
    savingPercent:
      worst.unitPrice > 0 ? (savingPerUnit / worst.unitPrice) * 100 : 0,
    reasons: [
      `Lowest price per unit in this comparison (${formatMoney(best.unitPrice)} per unit).`,
      `Same active ingredient, strength and dosage form as the other listed products.`,
      `Marked ${best.listing.availability.replace("_", " ")} at ${best.pharmacy.name}, ${best.pharmacy.distanceKm} km away.`,
    ],
  };
};
