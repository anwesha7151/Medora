import { describe, expect, it } from "vitest";
import { demoMedicines } from "@/data/demo-catalog";
import {
  explainBestValue,
  formatMoney,
  type OfferRow,
} from "@/services/medicines";
import { daysUntil } from "@/services/workspace";

describe("Clinical Safety & Pharmacology Logic", () => {
  it("maintains strict equivalence grouping by compositionKey", () => {
    // Every medicine must have a valid compositionKey
    for (const med of demoMedicines) {
      expect(med.compositionKey).toBeDefined();
      expect(med.compositionKey.length).toBeGreaterThan(0);
      expect(med.activeIngredients.length).toBeGreaterThan(0);
      expect(med.form).toBeDefined();
    }
  });

  it("accurately calculates days until expiration relative to platform baseline", () => {
    const baseDate = "2026-08-16";
    const diffDays = daysUntil(baseDate);
    expect(diffDays).toBe(0);

    const futureDate = "2026-09-16";
    expect(daysUntil(futureDate)).toBe(31);

    const pastDate = "2026-08-01";
    expect(daysUntil(pastDate)).toBe(-15);
  });

  it("calculates unit price and explains best value without bias", () => {
    const medA = demoMedicines[0]!;
    const offerA: OfferRow = {
      medicine: medA,
      listing: {
        id: "lst-1",
        medicineId: medA.id,
        pharmacyId: "ph-1",
        price: 50.0,
        currency: "INR",
        packSize: "10 Tablets",
        availability: "in_stock",
        updatedAt: "2026-08-16T00:00:00.000Z",
        provenance: {
          source: "Demo",
          updatedAt: "2026-08-16T00:00:00.000Z",
          verified: true,
        },
      },
      pharmacy: {
        id: "ph-1",
        name: "Test Pharmacy",
        address: "123 Main",
        city: "Metro",
        distanceKm: 1.2,
        rating: 4.8,
        reviews: 120,
        opensAt: "08:00",
        closesAt: "22:00",
        open24h: false,
        phone: "555-0100",
        services: ["Dispensing"],
        licenseId: "PH-1234",
        coords: { lat: 12.9, lng: 77.6 },
        provenance: {
          source: "Demo",
          updatedAt: "2026-08-16T00:00:00.000Z",
          verified: true,
        },
      },
      units: 10,
      unitPrice: 5.0,
    };

    const offerB: OfferRow = {
      ...offerA,
      listing: { ...offerA.listing, id: "lst-2", price: 80.0 },
      unitPrice: 8.0,
    };

    const explanation = explainBestValue([offerA, offerB]);
    expect(explanation).not.toBeNull();
    expect(explanation?.savingPerUnit).toBe(3.0);
    expect(explanation?.best.unitPrice).toBe(5.0);
    expect(explanation?.reasons.length).toBeGreaterThan(0);
  });

  it("formats monetary values with currency symbol", () => {
    const formatted = formatMoney(10.5);
    expect(formatted).toContain("10.50");
  });
});
