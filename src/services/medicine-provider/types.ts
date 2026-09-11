import type { Medicine, Pharmacy, PriceListing } from "@/lib/domain";

export interface IMedicineProvider {
  /** Uniquely identifies the provider */
  readonly id: string;
  readonly isLive: boolean;

  /** Get provider connectivity status */
  getStatus(): Promise<{ connected: boolean; message: string }>;

  /** Search medicines by brand, generic, active ingredient */
  searchMedicines(query: string): Promise<Medicine[]>;

  /** Get a single medicine by ID */
  getMedicine(id: string): Promise<Medicine | undefined>;

  /** Find medicines sharing the same active ingredient + strength + form */
  getEquivalents(medicine: Medicine): Promise<Medicine[]>;

  // Pharmacy/Inventory abstraction
  getPharmacies(): Promise<Pharmacy[]>;
  getPharmacy(id: string): Promise<Pharmacy | undefined>;
  getOffers(medicineIds: string[]): Promise<PriceListing[]>;
  getPharmacyStock(pharmacyId: string): Promise<PriceListing[]>;
}
