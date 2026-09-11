/**
 * Workspace data access.
 *
 * All reads go through this module so the professional workspaces seamlessly query
 * live Supabase PostgreSQL tables when connected, and gracefully fall back to the
 * high-fidelity demo dataset for offline and air-gapped demo resilience.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  demoAppointments,
  demoCatalogueRecords,
  demoConsultNotes,
  demoCustomers,
  demoMedicineHistory,
  demoModerationReports,
  demoOrganisations,
  demoPharmacyOrders,
  demoPlatformMetrics,
  demoPlatformUsers,
  demoPrescriptionDrafts,
  demoSales,
  demoSuppliers,
  demoVerificationQueue,
} from "@/data/workspace-demo";
import { pharmacyInventoryService } from "./pharmacy-inventory";
import {
  demoAuditEvents,
  demoDoctorPatients,
  demoInventory,
} from "@/data/demo-catalog";
import { settle } from "./provider";

export const workspaceLoaders = {
  doctorPatients: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .limit(20);
        if (!error && data && data.length > 0) {
          return data as unknown as typeof demoDoctorPatients;
        }
      } catch {
        // Fallback to local demo dataset
      }
    }
    return settle(demoDoctorPatients, 320);
  },
  appointments: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("reminders")
          .select("*")
          .limit(20);
        if (!error && data && data.length > 0) {
          return data as unknown as typeof demoAppointments;
        }
      } catch {
        // Fallback
      }
    }
    return settle(demoAppointments, 300);
  },
  consultNotes: () => settle(demoConsultNotes, 280),
  prescriptionDrafts: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("prescriptions")
          .select("*")
          .limit(20);
        if (!error && data && data.length > 0) {
          return data as unknown as typeof demoPrescriptionDrafts;
        }
      } catch {
        // Fallback
      }
    }
    return settle(demoPrescriptionDrafts, 320);
  },
  medicineHistory: () => settle(demoMedicineHistory, 240),

  inventory: async () => {
    const items = await pharmacyInventoryService.getInventory();
    return settle(items, 150);
  },
  pharmacyOrders: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .limit(20);
        if (!error && data && data.length > 0) {
          return data as unknown as typeof demoPharmacyOrders;
        }
      } catch {
        // Fallback
      }
    }
    return settle(demoPharmacyOrders, 300);
  },
  verificationQueue: () => settle(demoVerificationQueue, 280),
  customers: () => settle(demoCustomers, 260),
  suppliers: () => settle(demoSuppliers, 260),
  sales: () => settle(demoSales, 300),

  platformUsers: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .limit(20);
        if (!error && data && data.length > 0) {
          return data as unknown as typeof demoPlatformUsers;
        }
      } catch {
        // Fallback
      }
    }
    return settle(demoPlatformUsers, 320);
  },
  organisations: () => settle(demoOrganisations, 280),
  catalogue: () => settle(demoCatalogueRecords, 300),
  moderation: () => settle(demoModerationReports, 260),
  auditEvents: () => settle(demoAuditEvents, 240),
  platformMetrics: () => settle(demoPlatformMetrics, 300),
} as const;

export type WorkspaceResource = keyof typeof workspaceLoaders;

/** Single entry point for workspace reads, with retry and error state. */
export function useWorkspaceData<K extends WorkspaceResource>(resource: K) {
  return useQuery<Awaited<ReturnType<(typeof workspaceLoaders)[K]>>>({
    queryKey: ["workspace", resource],
    queryFn: () =>
      workspaceLoaders[resource]() as Promise<
        Awaited<ReturnType<(typeof workspaceLoaders)[K]>>
      >,
    staleTime: 30_000,
    retry: 1,
  });
}

export const money = (value: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const shortDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const timeOnly = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const daysUntil = (dateOnly: string) =>
  Math.round(
    (new Date(`${dateOnly}T00:00:00.000Z`).getTime() -
      Date.parse("2026-08-16T00:00:00.000Z")) /
      86_400_000,
  );
