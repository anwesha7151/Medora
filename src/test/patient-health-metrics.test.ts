import { describe, expect, it } from "vitest";
import { DEMO_PATIENTS_VITALS } from "@/data/patient-vitals-data";

describe("Patient Health Metrics & Telemetry", () => {
  it("loads demo patient vitals telemetry records with realistic clinical data", () => {
    expect(DEMO_PATIENTS_VITALS.length).toBeGreaterThan(0);
    const tribhuwan = DEMO_PATIENTS_VITALS.find((p) => p.patientId === "pt-1");
    expect(tribhuwan).toBeDefined();
    expect(tribhuwan?.patientName).toBe("Tribhuwan");
    expect(tribhuwan?.summaryStats.bloodPressure.latest).toBe("124/80");
    expect(tribhuwan?.summaryStats.glucose.estimatedHbA1c).toBe(6.2);
  });

  it("contains chronological longitudinal vitals history with blood pressure, glucose, and weight", () => {
    const pt = DEMO_PATIENTS_VITALS[0];
    expect(pt.vitalsHistory.length).toBeGreaterThanOrEqual(5);

    pt.vitalsHistory.forEach((v) => {
      expect(v.systolic).toBeGreaterThan(80);
      expect(v.systolic).toBeLessThan(220);
      expect(v.diastolic).toBeGreaterThan(40);
      expect(v.diastolic).toBeLessThan(140);
      expect(v.fastingGlucose).toBeGreaterThan(50);
      expect(v.weight).toBeGreaterThan(30);
      expect(v.spo2).toBeGreaterThanOrEqual(90);
    });
  });

  it("includes comprehensive lipid profile fractions and targets", () => {
    const pt = DEMO_PATIENTS_VITALS[0];
    expect(pt.lipidProfile.length).toBeGreaterThanOrEqual(4);
    const totalChol = pt.lipidProfile.find(
      (l) => l.metric === "Total Cholesterol",
    );
    expect(totalChol).toBeDefined();
    expect(totalChol?.value).toBeLessThan(300);
  });
});
