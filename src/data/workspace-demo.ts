/**
 * Indian Healthcare & Dispensary datasets for Medora professional workspaces (doctor, pharmacy, admin).
 *
 * Fully grounded with Indian names, verified CDSCO/IP medical formulations,
 * Rupee (INR ₹) figures, and Indian medical councils.
 */

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  at: string; // ISO
  durationMin: number;
  kind: "in_person" | "video" | "phone";
  reason: string;
  status: "scheduled" | "checked_in" | "in_consult" | "completed" | "cancelled";
}

export interface ConsultNote {
  id: string;
  patientId: string;
  at: string;
  author: string;
  kind: "consult" | "decision" | "prescription" | "ai_review" | "message";
  summary: string;
}

export interface DoctorPrescriptionDraft {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  origin: "clinician" | "patient_request" | "repeat_request";
  status: "draft" | "awaiting_review" | "signed" | "declined";
  items: {
    medicine: string;
    strength: string;
    form: string;
    directionsPlaceholder: string;
  }[];
  aiFlags: string[];
  clinicianNote?: string;
}

export interface MedicineHistoryEntry {
  id: string;
  patientId: string;
  medicine: string;
  strength: string;
  startedOn: string;
  endedOn?: string;
  source: "clinic record" | "patient entry" | "uploaded prescription";
  status: "current" | "past";
}

export const demoAppointments: Appointment[] = [
  {
    id: "ap-1",
    patientId: "pt-1",
    patientName: "Aria Mehta",
    at: "2026-08-16T09:00:00.000Z",
    durationMin: 20,
    kind: "in_person",
    reason: "Hypertension & HbA1c Quarterly Review",
    status: "checked_in",
  },
  {
    id: "ap-2",
    patientId: "pt-2",
    patientName: "Aditya Verma",
    at: "2026-08-16T09:30:00.000Z",
    durationMin: 30,
    kind: "video",
    reason: "Persistent monsoon bronchospasm consult",
    status: "in_consult",
  },
  {
    id: "ap-3",
    patientId: "pt-3",
    patientName: "Priya Patel",
    at: "2026-08-16T10:15:00.000Z",
    durationMin: 15,
    kind: "phone",
    reason: "Antihistamine & Allergic Rhinitis Refill",
    status: "scheduled",
  },
  {
    id: "ap-4",
    patientId: "pt-4",
    patientName: "Rahul Sharma",
    at: "2026-08-16T11:00:00.000Z",
    durationMin: 30,
    kind: "in_person",
    reason: "Cardiometabolic Medicines Reconciliation",
    status: "scheduled",
  },
  {
    id: "ap-5",
    patientId: "pt-1",
    patientName: "Aria Mehta",
    at: "2026-08-17T14:00:00.000Z",
    durationMin: 20,
    kind: "video",
    reason: "Lipid Profile Follow-up & Diet Review",
    status: "scheduled",
  },
  {
    id: "ap-6",
    patientId: "pt-3",
    patientName: "Priya Patel",
    at: "2026-08-15T15:30:00.000Z",
    durationMin: 15,
    kind: "phone",
    reason: "Sulfa Drug Allergy Record Confirmation",
    status: "completed",
  },
  {
    id: "ap-7",
    patientId: "pt-5",
    patientName: "Ananya Deshmukh",
    at: "2026-08-16T16:00:00.000Z",
    durationMin: 25,
    kind: "in_person",
    reason: "Thyroid TSH Level Assessment",
    status: "scheduled",
  },
];

export const demoConsultNotes: ConsultNote[] = [
  {
    id: "cn-1",
    patientId: "pt-1",
    at: "2026-08-13T11:02:00.000Z",
    author: "Patient (Aria Mehta)",
    kind: "message",
    summary:
      "Updated clinical allergy profile to record penicillin sensitivity.",
  },
  {
    id: "cn-2",
    patientId: "pt-1",
    at: "2026-08-02T08:05:00.000Z",
    author: "Medora Clinical Assistive AI",
    kind: "ai_review",
    summary:
      "Assistive CDSCO cross-check summary generated after prescription upload. No high-risk DDI identified.",
  },
  {
    id: "cn-3",
    patientId: "pt-1",
    at: "2026-07-28T10:40:00.000Z",
    author: "Dr. Arvind Swaminathan, MD",
    kind: "decision",
    summary:
      "Reviewed uploaded prescription. Advised continuing Metformin 500mg BD with meals. Next review in 4 weeks.",
  },
  {
    id: "cn-4",
    patientId: "pt-2",
    at: "2026-08-14T09:20:00.000Z",
    author: "Medora Clinical Assistive AI",
    kind: "ai_review",
    summary:
      "Symptom log records non-productive nocturnal cough >14 days. Flagged for clinician pulmonary assessment.",
  },
  {
    id: "cn-5",
    patientId: "pt-2",
    at: "2026-06-14T13:10:00.000Z",
    author: "Dr. Laxman Deshmukh, MBBS",
    kind: "consult",
    summary:
      "Teleconsult completed. Correct MDI inhaler spacer technique demonstrated and documented.",
  },
  {
    id: "cn-6",
    patientId: "pt-3",
    at: "2026-08-01T10:00:00.000Z",
    author: "Patient (Priya Patel)",
    kind: "message",
    summary:
      "Requested pharmacist clarification on Levocetirizine vs Bilastine daytime drowsiness.",
  },
  {
    id: "cn-7",
    patientId: "pt-4",
    at: "2026-07-19T16:30:00.000Z",
    author: "Dr. Arvind Swaminathan, MD",
    kind: "decision",
    summary:
      "Post-discharge reconciliation recorded. Atorvastatin 20mg and Telmisartan 40mg re-verified.",
  },
];

export const demoPrescriptionDrafts: DoctorPrescriptionDraft[] = [
  {
    id: "dr-1",
    patientId: "pt-3",
    patientName: "Priya Patel",
    createdAt: "2026-08-15T09:12:00.000Z",
    origin: "patient_request",
    status: "awaiting_review",
    items: [
      {
        medicine: "Levocetirizine Dihydrochloride",
        strength: "5 mg",
        form: "Tablet",
        directionsPlaceholder: "1 tablet once daily at bedtime for 10 days",
      },
    ],
    aiFlags: [
      "Patient reported allergy class: Sulfa drugs. Confirm before prescribing Co-trimoxazole combinations.",
      "Generic alternative available: Cetirizine 10mg (35% lower cost).",
    ],
  },
  {
    id: "dr-2",
    patientId: "pt-1",
    patientName: "Aria Mehta",
    createdAt: "2026-08-14T08:40:00.000Z",
    origin: "repeat_request",
    status: "awaiting_review",
    items: [
      {
        medicine: "Metformin Hydrochloride IP (Glycomet)",
        strength: "500 mg",
        form: "Tablet",
        directionsPlaceholder: "1 tablet twice daily with breakfast & dinner",
      },
    ],
    aiFlags: [
      "Repeat refill matches 6-month diabetic protocol. Clinician confirmation ready.",
    ],
  },
  {
    id: "dr-3",
    patientId: "pt-4",
    patientName: "Rahul Sharma",
    createdAt: "2026-08-09T15:02:00.000Z",
    origin: "clinician",
    status: "signed",
    items: [
      {
        medicine: "Telmisartan IP (Telma)",
        strength: "40 mg",
        form: "Tablet",
        directionsPlaceholder: "1 tablet once daily in the morning",
      },
      {
        medicine: "Atorvastatin Calcium IP (Atorva)",
        strength: "10 mg",
        form: "Tablet",
        directionsPlaceholder: "1 tablet once daily at bedtime",
      },
    ],
    aiFlags: [],
    clinicianNote:
      "Signed after cardiology review on 9 August (Apollo Clinic Indiranagar).",
  },
  {
    id: "dr-4",
    patientId: "pt-2",
    patientName: "Aditya Verma",
    createdAt: "2026-08-06T11:25:00.000Z",
    origin: "patient_request",
    status: "declined",
    items: [
      {
        medicine: "Amoxicillin and Potassium Clavulanate (Augmentin)",
        strength: "625 mg",
        form: "Tablet",
        directionsPlaceholder: "—",
      },
    ],
    aiFlags: [
      "Schedule H1 Restricted Antibiotic. In-person clinical assessment required to prevent antimicrobial resistance.",
    ],
    clinicianNote:
      "Declined: Antibiotic stewardship protocol requires in-person chest examination first.",
  },
];

export const demoMedicineHistory: MedicineHistoryEntry[] = [
  {
    id: "mh-1",
    patientId: "pt-1",
    medicine: "Metformin Hydrochloride IP",
    strength: "500 mg",
    startedOn: "2025-11-04",
    source: "clinic record",
    status: "current",
  },
  {
    id: "mh-2",
    patientId: "pt-1",
    medicine: "Amoxicillin and Potassium Clavulanate",
    strength: "625 mg",
    startedOn: "2026-07-28",
    endedOn: "2026-08-04",
    source: "uploaded prescription",
    status: "past",
  },
  {
    id: "mh-3",
    patientId: "pt-2",
    medicine: "Salbutamol Inhaler IP (Asthalin)",
    strength: "100 mcg / dose",
    startedOn: "2024-02-19",
    source: "clinic record",
    status: "current",
  },
  {
    id: "mh-4",
    patientId: "pt-3",
    medicine: "Levocetirizine IP",
    strength: "5 mg",
    startedOn: "2026-05-02",
    source: "patient entry",
    status: "current",
  },
  {
    id: "mh-5",
    patientId: "pt-4",
    medicine: "Telmisartan IP",
    strength: "40 mg",
    startedOn: "2023-09-11",
    source: "clinic record",
    status: "current",
  },
  {
    id: "mh-6",
    patientId: "pt-4",
    medicine: "Paracetamol IP (Dolo 650)",
    strength: "650 mg",
    startedOn: "2026-07-01",
    source: "patient entry",
    status: "current",
  },
];

/* ------------------------------- pharmacy ------------------------------- */

export interface SalesPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}

export interface PharmacyOrderRow {
  id: string;
  customer: string;
  placedAt: string;
  channel: "reservation" | "delivery" | "counter";
  items: number;
  total: number;
  prescriptionRequired: boolean;
  status:
    | "awaiting_prescription"
    | "verifying"
    | "accepted"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
}

export interface PharmacyCustomer {
  id: string;
  name: string;
  since: string;
  orders: number;
  lastOrder: string;
  spend: number;
  consentMarketing: boolean;
  flags: string[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  leadTimeDays: number;
  openPurchaseOrders: number;
  onTimeRate: number;
  lastDelivery: string;
  status: "active" | "review" | "paused";
}

export interface VerificationQueueRow {
  id: string;
  prescriptionId: string;
  patient: string;
  prescriber: string;
  receivedAt: string;
  items: number;
  confidence: number;
  status: "waiting" | "in_review" | "approved" | "rejected";
  note?: string;
}

export const demoSales: SalesPoint[] = [
  { date: "2026-08-03", revenue: 48400, orders: 62 },
  { date: "2026-08-04", revenue: 54100, orders: 74 },
  { date: "2026-08-05", revenue: 51750, orders: 68 },
  { date: "2026-08-06", revenue: 62600, orders: 81 },
  { date: "2026-08-07", revenue: 68300, orders: 88 },
  { date: "2026-08-08", revenue: 74900, orders: 95 },
  { date: "2026-08-09", revenue: 42200, orders: 51 },
  { date: "2026-08-10", revenue: 59400, orders: 77 },
  { date: "2026-08-11", revenue: 64150, orders: 82 },
  { date: "2026-08-12", revenue: 71800, orders: 90 },
  { date: "2026-08-13", revenue: 79050, orders: 99 },
  { date: "2026-08-14", revenue: 86200, orders: 104 },
];

export const demoPharmacyOrders: PharmacyOrderRow[] = [
  {
    id: "MD-4821",
    customer: "Aria Mehta",
    placedAt: "2026-08-14T15:02:00.000Z",
    channel: "reservation",
    items: 2,
    total: 340.0,
    prescriptionRequired: false,
    status: "ready",
  },
  {
    id: "MD-4822",
    customer: "Aditya Verma",
    placedAt: "2026-08-14T16:20:00.000Z",
    channel: "delivery",
    items: 3,
    total: 1480.0,
    prescriptionRequired: true,
    status: "awaiting_prescription",
  },
  {
    id: "MD-4823",
    customer: "Priya Patel",
    placedAt: "2026-08-15T08:41:00.000Z",
    channel: "reservation",
    items: 4,
    total: 1820.0,
    prescriptionRequired: true,
    status: "verifying",
  },
  {
    id: "MD-4824",
    customer: "Rahul Sharma",
    placedAt: "2026-08-15T09:55:00.000Z",
    channel: "counter",
    items: 2,
    total: 520.0,
    prescriptionRequired: false,
    status: "completed",
  },
  {
    id: "MD-4825",
    customer: "Rohan Kulkarni",
    placedAt: "2026-08-15T11:10:00.000Z",
    channel: "delivery",
    items: 5,
    total: 3450.0,
    prescriptionRequired: false,
    status: "preparing",
  },
  {
    id: "MD-4826",
    customer: "Siddharth Malhotra",
    placedAt: "2026-08-15T12:34:00.000Z",
    channel: "reservation",
    items: 2,
    total: 890.0,
    prescriptionRequired: true,
    status: "accepted",
  },
  {
    id: "MD-4827",
    customer: "Meera Nair",
    placedAt: "2026-08-15T14:02:00.000Z",
    channel: "counter",
    items: 1,
    total: 280.0,
    prescriptionRequired: false,
    status: "cancelled",
  },
  {
    id: "MD-4828",
    customer: "Aria Mehta",
    placedAt: "2026-08-16T08:15:00.000Z",
    channel: "reservation",
    items: 3,
    total: 1120.0,
    prescriptionRequired: false,
    status: "verifying",
  },
  {
    id: "MD-4829",
    customer: "Vikram Singhania",
    placedAt: "2026-08-16T08:47:00.000Z",
    channel: "delivery",
    items: 6,
    total: 5240.0,
    prescriptionRequired: true,
    status: "preparing",
  },
  {
    id: "MD-4830",
    customer: "Ananya Deshmukh",
    placedAt: "2026-08-16T09:12:00.000Z",
    channel: "reservation",
    items: 2,
    total: 1290.0,
    prescriptionRequired: false,
    status: "ready",
  },
  {
    id: "MD-4831",
    customer: "Sunita Rao",
    placedAt: "2026-08-16T09:40:00.000Z",
    channel: "counter",
    items: 3,
    total: 2450.0,
    prescriptionRequired: false,
    status: "completed",
  },
  {
    id: "MD-4832",
    customer: "Kavita Reddy",
    placedAt: "2026-08-16T10:05:00.000Z",
    channel: "delivery",
    items: 2,
    total: 980.0,
    prescriptionRequired: true,
    status: "awaiting_prescription",
  },
];

export const demoCustomers: PharmacyCustomer[] = [
  {
    id: "cu-1",
    name: "Aria Mehta",
    since: "2025-03-11",
    orders: 14,
    lastOrder: "2026-08-16",
    spend: 18450.0,
    consentMarketing: false,
    flags: ["Allergy on file (Penicillin)"],
  },
  {
    id: "cu-2",
    name: "Aditya Verma",
    since: "2024-10-02",
    orders: 22,
    lastOrder: "2026-08-14",
    spend: 34200.0,
    consentMarketing: true,
    flags: ["Repeat Inhaler Patient"],
  },
  {
    id: "cu-3",
    name: "Priya Patel",
    since: "2026-01-19",
    orders: 5,
    lastOrder: "2026-08-15",
    spend: 6450.0,
    consentMarketing: false,
    flags: ["Sulfa Drug Allergy"],
  },
  {
    id: "cu-4",
    name: "Rahul Sharma",
    since: "2023-06-30",
    orders: 41,
    lastOrder: "2026-08-15",
    spend: 72800.0,
    consentMarketing: true,
    flags: ["Chronic Cardiometabolic Care"],
  },
  {
    id: "cu-5",
    name: "Rohan Kulkarni",
    since: "2025-11-08",
    orders: 9,
    lastOrder: "2026-08-15",
    spend: 14600.0,
    consentMarketing: false,
    flags: ["Express Dunzo Dispatch"],
  },
  {
    id: "cu-6",
    name: "Siddharth Malhotra",
    since: "2026-04-21",
    orders: 3,
    lastOrder: "2026-08-15",
    spend: 3890.0,
    consentMarketing: false,
    flags: [],
  },
  {
    id: "cu-7",
    name: "Vikram Singhania",
    since: "2024-02-14",
    orders: 27,
    lastOrder: "2026-08-16",
    spend: 48900.0,
    consentMarketing: true,
    flags: ["VIP Corporate Account"],
  },
  {
    id: "cu-8",
    name: "Ananya Deshmukh",
    since: "2025-07-05",
    orders: 11,
    lastOrder: "2026-08-16",
    spend: 16800.0,
    consentMarketing: false,
    flags: [],
  },
];

export const demoSuppliers: Supplier[] = [
  {
    id: "sp-1",
    name: "Cipla Central Distribution (Bengaluru)",
    contact: "orders@cipla-dist.in",
    leadTimeDays: 1,
    openPurchaseOrders: 4,
    onTimeRate: 0.98,
    lastDelivery: "2026-08-15",
    status: "active",
  },
  {
    id: "sp-2",
    name: "Sun Pharma Supply Logistics (Mumbai)",
    contact: "logistics@sunpharma-supply.in",
    leadTimeDays: 2,
    openPurchaseOrders: 2,
    onTimeRate: 0.94,
    lastDelivery: "2026-08-14",
    status: "active",
  },
  {
    id: "sp-3",
    name: "Dr. Reddy's Direct Warehouse (Hyderabad)",
    contact: "care@drreddys-direct.in",
    leadTimeDays: 1,
    openPurchaseOrders: 5,
    onTimeRate: 0.99,
    lastDelivery: "2026-08-16",
    status: "active",
  },
  {
    id: "sp-4",
    name: "Mankind Healthcare Wholesale (Delhi NCR)",
    contact: "desk@mankind-wholesale.in",
    leadTimeDays: 3,
    openPurchaseOrders: 1,
    onTimeRate: 0.88,
    lastDelivery: "2026-08-11",
    status: "review",
  },
];

export const demoVerificationQueue: VerificationQueueRow[] = [
  {
    id: "vq-1",
    prescriptionId: "rx-2201",
    patient: "Priya Patel",
    prescriber: "Dr. Laxman Deshmukh, MBBS (KMC/2018)",
    receivedAt: "2026-08-16T08:31:00.000Z",
    items: 2,
    confidence: 0.94,
    status: "waiting",
  },
  {
    id: "vq-2",
    prescriptionId: "rx-2202",
    patient: "Vikram Singhania",
    prescriber: "Dr. Arvind Swaminathan, MD (DMC/2014)",
    receivedAt: "2026-08-16T08:52:00.000Z",
    items: 3,
    confidence: 0.82,
    status: "in_review",
    note: "Schedule H1 Antibiotic line requiring registered pharmacist sign-off.",
  },
  {
    id: "vq-3",
    prescriptionId: "rx-2203",
    patient: "Siddharth Malhotra",
    prescriber: "Dr. Manisha Mukherjee, MD (MMC/2016)",
    receivedAt: "2026-08-16T09:04:00.000Z",
    items: 1,
    confidence: 0.96,
    status: "waiting",
  },
  {
    id: "vq-4",
    prescriptionId: "rx-2204",
    patient: "Kavita Reddy",
    prescriber: "Dr. Laxman Deshmukh, MBBS (KMC/2018)",
    receivedAt: "2026-08-15T17:20:00.000Z",
    items: 2,
    confidence: 0.71,
    status: "waiting",
    note: "Prescriber registration seal verified via National Medical Commission (NMC).",
  },
  {
    id: "vq-5",
    prescriptionId: "rx-2205",
    patient: "Aria Mehta",
    prescriber: "Dr. Arvind Swaminathan, MD (DMC/2014)",
    receivedAt: "2026-08-15T14:11:00.000Z",
    items: 1,
    confidence: 0.98,
    status: "approved",
  },
  {
    id: "vq-6",
    prescriptionId: "rx-2206",
    patient: "Meera Nair",
    prescriber: "Unverified Clinic Stamp",
    receivedAt: "2026-08-15T10:02:00.000Z",
    items: 1,
    confidence: 0.38,
    status: "rejected",
    note: "Prescriber state registration number not found on NMC database.",
  },
];

/* --------------------------------- admin -------------------------------- */

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: "patient" | "pharmacy" | "doctor" | "admin";
  status: "active" | "pending" | "suspended";
  joined: string;
  lastActive: string;
  mfa: boolean;
}

export interface OrganisationRecord {
  id: string;
  name: string;
  kind: "pharmacy" | "clinic";
  city: string;
  licenceId: string;
  verification: "verified" | "pending" | "expired";
  contact: string;
  onboarded: string;
}

export interface CatalogueRecord {
  id: string;
  brandName: string;
  genericName: string;
  form: string;
  compositionKey: string;
  metadataCompleteness: number;
  reviewState: "published" | "needs_review" | "quarantined";
  lastReviewed: string;
  source: string;
}

export interface ModerationReport {
  id: string;
  at: string;
  surface: "review" | "pharmacy profile" | "assistant answer" | "listing";
  target: string;
  reason: string;
  reporter: string;
  severity: "low" | "medium" | "high";
  status: "open" | "investigating" | "actioned" | "dismissed";
}

export interface PlatformMetricPoint {
  date: string;
  patients: number;
  professionals: number;
  searches: number;
}

export const demoPlatformUsers: PlatformUser[] = [
  {
    id: "us-1",
    name: "Aria Mehta",
    email: "aria.mehta@medora.in",
    role: "patient",
    status: "active",
    joined: "2025-03-11",
    lastActive: "2026-08-16",
    mfa: false,
  },
  {
    id: "us-2",
    name: "Apollo Pharmacy (24x7 Indiranagar)",
    email: "ops@apollopharmacy.in",
    role: "pharmacy",
    status: "active",
    joined: "2024-08-02",
    lastActive: "2026-08-16",
    mfa: true,
  },
  {
    id: "us-3",
    name: "Dr. Arvind Swaminathan, MD",
    email: "a.swaminathan@manipalhospitals.in",
    role: "doctor",
    status: "active",
    joined: "2024-05-19",
    lastActive: "2026-08-15",
    mfa: true,
  },
  {
    id: "us-4",
    name: "Dr. Laxman Deshmukh, MBBS",
    email: "l.deshmukh@fortishealthcare.in",
    role: "doctor",
    status: "pending",
    joined: "2026-08-10",
    lastActive: "2026-08-14",
    mfa: false,
  },
  {
    id: "us-5",
    name: "MedPlus Chemist (Koramangala)",
    email: "team@medplusindia.in",
    role: "pharmacy",
    status: "pending",
    joined: "2026-08-12",
    lastActive: "2026-08-16",
    mfa: false,
  },
  {
    id: "us-6",
    name: "Aditya Verma",
    email: "aditya.verma@medora.in",
    role: "patient",
    status: "active",
    joined: "2024-10-02",
    lastActive: "2026-08-14",
    mfa: false,
  },
  {
    id: "us-7",
    name: "Priya Patel",
    email: "priya.patel@medora.in",
    role: "patient",
    status: "active",
    joined: "2026-01-19",
    lastActive: "2026-08-15",
    mfa: true,
  },
  {
    id: "us-8",
    name: "Meera Nair",
    email: "meera.nair@medora.in",
    role: "patient",
    status: "suspended",
    joined: "2025-09-30",
    lastActive: "2026-07-28",
    mfa: false,
  },
  {
    id: "us-9",
    name: "Medora Central Operations",
    email: "admin@medora.in",
    role: "admin",
    status: "active",
    joined: "2023-01-04",
    lastActive: "2026-08-16",
    mfa: true,
  },
  {
    id: "us-10",
    name: "Dr. Manisha Mukherjee, MD",
    email: "m.mukherjee@maxhealthcare.in",
    role: "doctor",
    status: "active",
    joined: "2025-02-27",
    lastActive: "2026-08-13",
    mfa: true,
  },
  {
    id: "us-11",
    name: "Vikram Singhania",
    email: "vikram.singhania@medora.in",
    role: "patient",
    status: "active",
    joined: "2024-02-14",
    lastActive: "2026-08-16",
    mfa: false,
  },
  {
    id: "us-12",
    name: "Wellness Forever (MG Road Bengaluru)",
    email: "care@wellnessforever.in",
    role: "pharmacy",
    status: "suspended",
    joined: "2024-11-22",
    lastActive: "2026-06-02",
    mfa: true,
  },
];

export const demoOrganisations: OrganisationRecord[] = [
  {
    id: "og-1",
    name: "Apollo Pharmacy (24x7 Indiranagar)",
    kind: "pharmacy",
    city: "Bengaluru",
    licenceId: "KA-BLR-2024-APOLLO",
    verification: "verified",
    contact: "ops@apollopharmacy.in",
    onboarded: "2024-08-02",
  },
  {
    id: "og-2",
    name: "MedPlus Chemist (Koramangala)",
    kind: "pharmacy",
    city: "Bengaluru",
    licenceId: "KA-BLR-2023-MEDPLUS",
    verification: "pending",
    contact: "team@medplusindia.in",
    onboarded: "2026-08-12",
  },
  {
    id: "og-3",
    name: "Wellness Forever Chemist (Juhu)",
    kind: "pharmacy",
    city: "Mumbai",
    licenceId: "MH-MUM-2024-WELLNESS",
    verification: "verified",
    contact: "care@wellnessforever.in",
    onboarded: "2024-11-22",
  },
  {
    id: "og-4",
    name: "Manipal Hospital & Clinic (Bengaluru)",
    kind: "clinic",
    city: "Bengaluru",
    licenceId: "CL-KA-BLR-8810",
    verification: "verified",
    contact: "reception@manipalhospitals.in",
    onboarded: "2024-05-19",
  },
  {
    id: "og-5",
    name: "Fortis Healthcare & Diagnostics",
    kind: "clinic",
    city: "Bengaluru",
    licenceId: "CL-KA-BLR-4420",
    verification: "verified",
    contact: "admin@fortishealthcare.in",
    onboarded: "2025-02-27",
  },
];

export const demoCatalogueRecords: CatalogueRecord[] = [
  {
    id: "cat-1",
    brandName: "Dolo 650",
    genericName: "Paracetamol IP",
    form: "Tablet",
    compositionKey: "paracetamol-650mg-tablet",
    metadataCompleteness: 0.99,
    reviewState: "published",
    lastReviewed: "2026-08-15",
    source: "CDSCO National Formulary of India",
  },
  {
    id: "cat-2",
    brandName: "Augmentin 625 Duo",
    genericName: "Amoxycillin and Potassium Clavulanate IP",
    form: "Tablet",
    compositionKey: "amoxicillin-500mg-clavulanic-125mg-tablet",
    metadataCompleteness: 0.97,
    reviewState: "published",
    lastReviewed: "2026-08-12",
    source: "CDSCO National Formulary of India",
  },
  {
    id: "cat-3",
    brandName: "Levocet 5",
    genericName: "Levocetirizine Dihydrochloride IP",
    form: "Tablet",
    compositionKey: "levocetirizine-5mg-tablet",
    metadataCompleteness: 0.92,
    reviewState: "published",
    lastReviewed: "2026-08-10",
    source: "CDSCO National Formulary of India",
  },
  {
    id: "cat-4",
    brandName: "Glycomet 500",
    genericName: "Metformin Hydrochloride IP",
    form: "Tablet",
    compositionKey: "metformin-500mg-tablet",
    metadataCompleteness: 0.96,
    reviewState: "published",
    lastReviewed: "2026-08-14",
    source: "CDSCO National Formulary of India",
  },
  {
    id: "cat-5",
    brandName: "Telma 40",
    genericName: "Telmisartan IP",
    form: "Tablet",
    compositionKey: "telmisartan-40mg-tablet",
    metadataCompleteness: 0.95,
    reviewState: "published",
    lastReviewed: "2026-08-11",
    source: "CDSCO National Formulary of India",
  },
  {
    id: "cat-6",
    brandName: "Asthalin Inhaler",
    genericName: "Salbutamol IP",
    form: "Inhaler",
    compositionKey: "salbutamol-100mcg-inhaler",
    metadataCompleteness: 0.94,
    reviewState: "published",
    lastReviewed: "2026-08-08",
    source: "CDSCO National Formulary of India",
  },
];

export const demoModerationReports: ModerationReport[] = [
  {
    id: "mr-1",
    at: "2026-08-16T07:45:00.000Z",
    surface: "review",
    target: "Review on Apollo Pharmacy (Indiranagar)",
    reason: "Contains medical advice from a non-licensed individual",
    reporter: "patient (verified)",
    severity: "high",
    status: "open",
  },
  {
    id: "mr-2",
    at: "2026-08-15T19:02:00.000Z",
    surface: "listing",
    target: "Augmentin 625 Duo Pack",
    reason: "Listing price exceeds DPCO Ceiling Price cap",
    reporter: "pharmacist (verified)",
    severity: "medium",
    status: "investigating",
  },
  {
    id: "mr-3",
    at: "2026-08-15T12:20:00.000Z",
    surface: "assistant answer",
    target: "Assistant answer #a-4412",
    reason:
      "Antibiotic dosage inquiry flagged for clinical prescription gating",
    reporter: "system audit",
    severity: "high",
    status: "actioned",
  },
  {
    id: "mr-4",
    at: "2026-08-14T09:31:00.000Z",
    surface: "pharmacy profile",
    target: "MedPlus Chemist (Koramangala)",
    reason: "Night hours dispensary timing updated",
    reporter: "pharmacy admin",
    severity: "low",
    status: "actioned",
  },
];

export const demoPlatformMetrics: PlatformMetricPoint[] = [
  { date: "2026-08-03", patients: 1180, professionals: 42, searches: 4210 },
  { date: "2026-08-05", patients: 1244, professionals: 44, searches: 4585 },
  { date: "2026-08-07", patients: 1310, professionals: 46, searches: 4920 },
  { date: "2026-08-09", patients: 1355, professionals: 47, searches: 4410 },
  { date: "2026-08-11", patients: 1428, professionals: 49, searches: 5230 },
  { date: "2026-08-13", patients: 1502, professionals: 51, searches: 5610 },
  { date: "2026-08-15", patients: 1587, professionals: 54, searches: 5980 },
];
