import { createClient } from "@supabase/supabase-js";

const url =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://kmplxhpsogebqsiexbst.supabase.co";
const secretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  console.log("Seeding Supabase Database with initial records...");

  // 1. Audit events
  const auditEvents = [
    {
      id: "aud-001",
      at: new Date(Date.now() - 3600000 * 2).toISOString(),
      actor: "system",
      role: "admin",
      category: "database",
      action: "SCHEMA_PROVISIONED",
      target: "public.medicines",
      ip: "127.0.0.1",
      status: "success",
      details:
        "Initial Medora pharmaceutical catalog schema and Indian medicine indices initialized.",
    },
    {
      id: "aud-002",
      at: new Date(Date.now() - 3600000).toISOString(),
      actor: "ph-apollo-bandra",
      role: "pharmacy",
      category: "inventory",
      action: "BATCH_VERIFICATION",
      target: "Apollo Pharmacy — Bandra West",
      ip: "103.21.124.8",
      status: "success",
      details:
        "Verified cold-chain temperature telemetry logs (+4.2°C) and Dolo 650 stock availability.",
    },
    {
      id: "aud-003",
      at: new Date().toISOString(),
      actor: "dr-sharma-md",
      role: "doctor",
      category: "clinical",
      action: "PRESCRIPTION_AUTHORIZATION",
      target: "Dr. Sharma, MD",
      ip: "103.21.124.9",
      status: "success",
      details:
        "Clinical consultation note signed and verified for patient follow-up.",
    },
  ];

  const { error: audErr } = await supabase
    .from("audit_events")
    .upsert(auditEvents);
  if (audErr) console.log("Audit Events Error:", audErr.message);
  else console.log("✅ Seeded audit_events:", auditEvents.length, "rows");

  console.log("🎉 Database seeding complete!");
}

seed().catch(console.error);
