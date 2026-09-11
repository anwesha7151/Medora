import { describe, expect, it } from "vitest";
import {
  demoAppointments,
  demoModerationReports,
  demoOrganisations,
  demoPlatformUsers,
  demoPrescriptionDrafts,
} from "@/data/workspace-demo";
import {
  demoDoctorPatients,
  demoInventory,
  demoMedicines,
} from "@/data/demo-catalog";

describe("Medora 4-Portal Ecosystem Data Integrity & Workflows", () => {
  describe("Patient Portal", () => {
    it("provides complete medicine catalog with prescription gating flags", () => {
      expect(demoMedicines.length).toBeGreaterThan(0);
      const rxOnly = demoMedicines.filter((m) => m.prescriptionOnly);
      const otc = demoMedicines.filter((m) => !m.prescriptionOnly);
      expect(rxOnly.length).toBeGreaterThan(0);
      expect(otc.length).toBeGreaterThan(0);
    });

    it("verifies composition structure for every catalog item", () => {
      for (const med of demoMedicines) {
        expect(med.brandName).toBeTruthy();
        expect(med.genericName).toBeTruthy();
        expect(med.usesSummary).toBeTruthy();
        expect(Array.isArray(med.warnings)).toBe(true);
        expect(Array.isArray(med.commonSideEffects)).toBe(true);
      }
    });
  });

  describe("Clinician Portal", () => {
    it("contains structured doctor patient queue with clinical reason and active medicines", () => {
      expect(demoDoctorPatients.length).toBeGreaterThan(0);
      for (const pt of demoDoctorPatients) {
        expect(pt.id).toBeTruthy();
        expect(pt.name).toBeTruthy();
        expect(pt.ageBand).toBeTruthy();
        expect(Array.isArray(pt.currentMedicines)).toBe(true);
        expect(Array.isArray(pt.allergies)).toBe(true);
      }
    });

    it("tracks appointment schedule with valid status lifecycle and modalities", () => {
      expect(demoAppointments.length).toBeGreaterThan(0);
      const allowedStatuses = [
        "scheduled",
        "checked_in",
        "in_consult",
        "completed",
        "cancelled",
      ];
      const allowedKinds = ["in_person", "video", "phone"];

      for (const app of demoAppointments) {
        expect(allowedStatuses).toContain(app.status);
        expect(allowedKinds).toContain(app.kind);
        expect(app.durationMin).toBeGreaterThan(0);
      }
    });

    it("includes prescription review drafts with assistive flags", () => {
      expect(demoPrescriptionDrafts.length).toBeGreaterThan(0);
      for (const draft of demoPrescriptionDrafts) {
        expect(draft.patientName).toBeTruthy();
        expect(draft.items.length).toBeGreaterThan(0);
        expect(Array.isArray(draft.aiFlags)).toBe(true);
      }
    });
  });

  describe("Pharmacy Console", () => {
    it("validates inventory items with stock levels, batch numbers, and reorder triggers", () => {
      expect(demoInventory.length).toBeGreaterThan(0);
      for (const item of demoInventory) {
        expect(item.name).toBeTruthy();
        expect(item.batch).toBeTruthy();
        expect(item.stock).toBeGreaterThanOrEqual(0);
        expect(item.reorderLevel).toBeGreaterThan(0);
        expect(item.expiry).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe("Platform Admin Console", () => {
    it("contains organisation records with valid regulatory verification states", () => {
      expect(demoOrganisations.length).toBeGreaterThan(0);
      const allowedVerifications = ["verified", "pending", "expired"];
      for (const org of demoOrganisations) {
        expect(org.licenceId).toBeTruthy();
        expect(allowedVerifications).toContain(org.verification);
      }
    });

    it("contains platform user accounts with RBAC roles", () => {
      expect(demoPlatformUsers.length).toBeGreaterThan(0);
      const allowedRoles = ["patient", "doctor", "pharmacy", "admin"];
      for (const user of demoPlatformUsers) {
        expect(allowedRoles).toContain(user.role);
        expect(typeof user.mfa).toBe("boolean");
      }
    });

    it("maintains content moderation queue with severity tiers and open tickets", () => {
      expect(demoModerationReports.length).toBeGreaterThan(0);
      const allowedSeverities = ["high", "medium", "low"];
      const allowedStatuses = [
        "open",
        "investigating",
        "actioned",
        "dismissed",
      ];

      for (const report of demoModerationReports) {
        expect(allowedSeverities).toContain(report.severity);
        expect(allowedStatuses).toContain(report.status);
        expect(report.reason).toBeTruthy();
        expect(report.target).toBeTruthy();
      }
    });
  });
});
