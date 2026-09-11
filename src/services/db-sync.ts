import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type {
  Order,
  Reminder,
  Prescription,
  LabReport,
  HealthProfile,
} from "@/lib/domain";

/**
 * Service to sync application state with Supabase Postgres tables.
 * When Supabase is configured and authenticated, data is persisted to PostgreSQL
 * with Row-Level Security (RLS) multi-tenant protection.
 * LocalStorage serves as an immediate local cache / offline fallback.
 */

export async function syncOrderToPostgres(
  order: Order,
  userId: string = "00000000-0000-0000-0000-000000000001",
) {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("orders").upsert({
      id: order.id,
      user_id: userId,
      pharmacy_id: order.pharmacyId,
      pharmacy_name: order.pharmacyName,
      placed_at: order.placedAt,
      items: order.items as unknown as Json,
      total: order.total,
      fulfilment: order.fulfilment,
      prescription_id: order.prescriptionId ?? null,
      status: order.status,
      timeline: order.timeline as unknown as Json,
      created_at: order.placedAt,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn("[Postgres Sync] Order sync warning:", error.message);
    }
  } catch (err) {
    console.warn("[Postgres Sync] Network error syncing order:", err);
  }
}

export async function syncReminderToPostgres(
  reminder: Reminder,
  userId: string = "00000000-0000-0000-0000-000000000001",
) {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("reminders").upsert({
      id: reminder.id,
      user_id: userId,
      medicine_name: reminder.medicineName,
      strength: reminder.strength,
      times: reminder.times,
      start_date: reminder.startDate,
      end_date: reminder.endDate ?? null,
      instruction: reminder.instruction,
      source_prescription_id: reminder.sourcePrescriptionId ?? null,
      active: reminder.active,
      log: reminder.log as unknown as Json,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn("[Postgres Sync] Reminder sync warning:", error.message);
    }
  } catch (err) {
    console.warn("[Postgres Sync] Network error syncing reminder:", err);
  }
}

export async function syncPrescriptionToPostgres(
  rx: Prescription,
  userId: string = "00000000-0000-0000-0000-000000000001",
) {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("prescriptions").upsert({
      id: rx.id,
      user_id: userId,
      file_name: rx.fileName,
      uploaded_at: rx.uploadedAt,
      prescriber_name: rx.prescriberName ?? null,
      status: rx.status,
      patient_name: rx.patientName ?? null,
      items: rx.items as unknown as Json,
      created_at: rx.uploadedAt,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn("[Postgres Sync] Prescription sync warning:", error.message);
    }
  } catch (err) {
    console.warn("[Postgres Sync] Network error syncing prescription:", err);
  }
}

export async function syncLabReportToPostgres(
  report: LabReport,
  userId: string = "00000000-0000-0000-0000-000000000001",
) {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("lab_reports").upsert({
      id: report.id,
      user_id: userId,
      file_name: report.fileName,
      uploaded_at: report.uploadedAt,
      panel: report.panel,
      values: report.values as unknown as Json,
      created_at: report.uploadedAt,
    });
    if (error) {
      console.warn("[Postgres Sync] Lab report sync warning:", error.message);
    }
  } catch (err) {
    console.warn("[Postgres Sync] Network error syncing lab report:", err);
  }
}

export async function syncProfileToPostgres(
  profile: HealthProfile,
  userId: string = "00000000-0000-0000-0000-000000000001",
) {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: profile.fullName,
      email: profile.email,
      city: profile.city,
      phone: null,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn("[Postgres Sync] Profile sync warning:", error.message);
    }
  } catch (err) {
    console.warn("[Postgres Sync] Network error syncing profile:", err);
  }
}
