import { demoMedicines, demoPharmacies, demoPrices } from "@/data/demo-catalog";
import type { Medicine, Pharmacy, PriceListing } from "@/lib/domain";
import type { IMedicineProvider } from "./types";
import { settle } from "../provider";

export class DemoMedicineProvider implements IMedicineProvider {
  readonly id = "demo";
  readonly isLive = false;

  async getStatus() {
    return { connected: true, message: "Using local demo data." };
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    const q = query.trim().toLowerCase();
    const results = !q
      ? demoMedicines
      : demoMedicines.filter((m) =>
          [
            m.brandName,
            m.genericName,
            m.manufacturer,
            m.form,
            ...m.activeIngredients.map((a) => `${a.name} ${a.strength}`),
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
        );
    return settle(results);
  }

  async getMedicine(id: string): Promise<Medicine | undefined> {
    return settle(demoMedicines.find((m) => m.id === id));
  }

  async getEquivalents(medicine: Medicine): Promise<Medicine[]> {
    return settle(
      demoMedicines.filter(
        (m) =>
          m.compositionKey === medicine.compositionKey && m.id !== medicine.id,
      ),
    );
  }

  async getPharmacies(): Promise<Pharmacy[]> {
    return settle(
      [...demoPharmacies].sort((a, b) => a.distanceKm - b.distanceKm),
    );
  }

  async getPharmacy(id: string): Promise<Pharmacy | undefined> {
    return settle(demoPharmacies.find((p) => p.id === id));
  }

  async getOffers(medicineIds: string[]): Promise<PriceListing[]> {
    return settle(demoPrices.filter((p) => medicineIds.includes(p.medicineId)));
  }

  async getPharmacyStock(pharmacyId: string): Promise<PriceListing[]> {
    return settle(demoPrices.filter((p) => p.pharmacyId === pharmacyId));
  }
}
