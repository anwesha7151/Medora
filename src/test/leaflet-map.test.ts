import { describe, expect, it } from "vitest";
import { demoPharmacies } from "@/data/demo-catalog";

describe("Leaflet Map Medical Stores Integration", () => {
  it("contains rich medical store nodes across key urban centers", () => {
    expect(demoPharmacies.length).toBeGreaterThanOrEqual(10);

    const bangaloreNodes = demoPharmacies.filter((p) => p.city === "Bengaluru");
    const mumbaiNodes = demoPharmacies.filter((p) => p.city === "Mumbai");

    expect(bangaloreNodes.length).toBeGreaterThan(5);
    expect(mumbaiNodes.length).toBeGreaterThanOrEqual(2);

    // Verify all nodes have valid coordinates, opening hours, and licenses
    demoPharmacies.forEach((pharmacy) => {
      expect(pharmacy.coords.lat).toBeGreaterThan(0);
      expect(pharmacy.coords.lng).toBeGreaterThan(0);
      expect(pharmacy.licenseId).toBeDefined();
      expect(pharmacy.phone).toBeDefined();
    });
  });

  it("identifies 24x7 emergency medical store nodes", () => {
    const emergencyStores = demoPharmacies.filter((p) => p.open24h);
    expect(emergencyStores.length).toBeGreaterThan(2);
    expect(
      emergencyStores.some(
        (s) => s.name.includes("24x7") || s.name.includes("24h"),
      ),
    ).toBe(true);
  });
});
