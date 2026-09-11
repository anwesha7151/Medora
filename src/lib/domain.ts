/**
 * Medora typed domain models.
 * These types are provider-agnostic: demo adapters and future live API adapters
 * both resolve to these shapes, so UI never changes when data sources change.
 */

export type DataProvider = "demo" | "live";

export interface Provenance {
  /** Human readable source of the record, e.g. a regulator or catalogue. */
  source: string;
  /** ISO date the record was last reviewed/updated by the source. */
  updatedAt: string;
  /** Whether the record originates from a connected, verified live provider. */
  verified: boolean;
  note?: string | undefined;
}

export type DosageForm =
  | "Tablet"
  | "Capsule"
  | "Syrup"
  | "Suspension"
  | "Injection"
  | "Cream"
  | "Drops"
  | "Inhaler";

export interface ActiveIngredient {
  name: string;
  strength: string; // e.g. "500 mg"
}

export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  activeIngredients: ActiveIngredient[];
  form: DosageForm;
  packSize: string;
  manufacturer: string;
  prescriptionOnly: boolean;
  /** Neutral, non-prescriptive description of what the product is indicated for. */
  usesSummary: string;
  commonSideEffects: string[];
  warnings: string[];
  storage: string;
  provenance: Provenance;
  /** Composition key: ingredient+strength+form. Basis of equivalence grouping. */
  compositionKey: string;
}

export interface PriceListing {
  id: string;
  medicineId: string;
  pharmacyId: string;
  price: number;
  currency: string;
  packSize: string;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  updatedAt: string;
  provenance: Provenance;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  opensAt: string;
  closesAt: string;
  open24h: boolean;
  phone: string;
  services: string[];
  licenseId: string;
  coords: { lat: number; lng: number };
  provenance: Provenance;
}

export interface PrescriptionItem {
  id: string;
  medicineText: string;
  strength: string;
  frequency: string;
  duration: string;
  notes?: string | undefined;
  confidence: number; // extraction confidence 0..1
  userConfirmed: boolean;
}

export interface Prescription {
  id: string;
  fileName: string;
  uploadedAt: string;
  prescriberName: string;
  status: "extracted" | "reviewed" | "verified" | "rejected";
  items: PrescriptionItem[];
  patientName?: string | undefined;
  reviewNote?: string | undefined;
}

export interface Reminder {
  id: string;
  medicineName: string;
  strength: string;
  times: string[]; // "08:00"
  startDate: string;
  endDate: string;
  instruction: string;
  sourcePrescriptionId?: string | undefined;
  active: boolean;
  log: { date: string; time: string; state: "taken" | "skipped" }[];
}

export interface ComparisonRecord {
  id: string;
  createdAt: string;
  compositionKey: string;
  label: string;
  medicineIds: string[];
  lowest: number;
  highest: number;
}

export interface OrderItem {
  medicineId: string;
  name: string;
  qty: number;
  price: number;
  prescriptionOnly: boolean;
}

export type OrderStatus =
  | "awaiting_prescription"
  | "verifying"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export interface PaymentDetails {
  method: "upi" | "card" | "netbanking" | "cod";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId?: string | undefined;
  receiptNumber?: string | undefined;
  paidAt?: string | undefined;
  amount: number;
  gstBreakdown?:
    | {
        subtotal: number;
        cgst: number;
        sgst: number;
        total: number;
      }
    | undefined;
}

export interface DeliveryDetails {
  partner:
    | "Dunzo MedExpress"
    | "Shadowfax Health Logistics"
    | "Porter Clinical"
    | "Local Express";
  riderName?: string | undefined;
  riderPhone?: string | undefined;
  vehicleNumber?: string | undefined;
  trackingNumber?: string | undefined;
  currentLat?: number | undefined;
  currentLng?: number | undefined;
  distanceKm?: number | undefined;
  estimatedMinutes?: number | undefined;
  deliveryAddress?: string | undefined;
}

export interface PrescriptionVerification {
  status: "not_required" | "pending" | "approved" | "rejected";
  verifiedByPharmacist?: string | undefined;
  pharmacistLicence?: string | undefined;
  digitalSignature?: string | undefined;
  verifiedAt?: string | undefined;
  verificationNotes?: string | undefined;
}

export interface CancellationDetails {
  cancelledAt?: string | undefined;
  reason?: string | undefined;
  refundStatus?: "not_applicable" | "processing" | "refunded" | undefined;
  refundAmount?: number | undefined;
  refundTransactionId?: string | undefined;
}

export interface Order {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  placedAt: string;
  items: OrderItem[];
  total: number;
  fulfilment: "pickup" | "delivery";
  prescriptionId?: string | undefined;
  status: OrderStatus;
  payment?: PaymentDetails | undefined;
  delivery?: DeliveryDetails | undefined;
  prescriptionVerification?: PrescriptionVerification | undefined;
  cancellation?: CancellationDetails | undefined;
  timeline: { state: OrderStatus; at: string; note: string }[];
}

export interface LabValue {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "within_range" | "outside_range" | "no_range_provided";
  explanation: string;
}

export interface LabReport {
  id: string;
  fileName: string;
  uploadedAt: string;
  panel: string;
  values: LabValue[];
}

export interface HealthProfile {
  fullName: string;
  email: string;
  ageBand: string;
  sex: string;
  city: string;
  allergies: string[];
  conditions: string[];
  currentMedicines: string[];
  pregnancyStatus: string;
  consentInformationalUse: boolean;
  consentDataProcessing: boolean;
  shareLocation: boolean;
}

export type AppRole = "patient" | "pharmacy" | "doctor" | "admin";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  at: string;
  kind: "reminder" | "price" | "order" | "safety" | "pharmacy" | "system";
  read: boolean;
  channels?: ("in_app" | "push" | "email" | "sms")[] | undefined;
  actionUrl?: string | undefined;
  actionLabel?: string | undefined;
  meta?:
    | {
        orderId?: string | undefined;
        medicineId?: string | undefined;
        severity?: "info" | "warning" | "critical" | undefined;
        priceDropPercent?: number | undefined;
      }
    | undefined;
}

export interface InventoryItem {
  id: string;
  medicineId: string;
  name: string;
  batch: string;
  stock: number;
  reorderLevel: number;
  price: number;
  expiry: string;
  supplier: string;
}

export interface DoctorPatient {
  id: string;
  name: string;
  ageBand: string;
  reason: string;
  lastVisit: string;
  status: "waiting" | "in_consult" | "review" | "closed";
  allergies: string[];
  currentMedicines: string[];
  aiSummary: string;
}

export interface UserActivityItem {
  id: string;
  action:
    | "search"
    | "view_medicine"
    | "compare"
    | "scan"
    | "order"
    | "reminder"
    | "clinical_note"
    | "verification";
  title: string;
  detail: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  patientName: string;
  author: string;
  content: string;
  category: "consult" | "decision" | "prescription" | "general";
  timestamp: string;
  doctorName?: string | undefined;
  doctorRole?: string | undefined;
  chiefComplaint?: string | undefined;
  diagnosis?: string | undefined;
  clinicalAssessment?: string | undefined;
  treatmentPlan?: string | undefined;
  prescribedMeds?: string[] | undefined;
  followUpDays?: number | undefined;
  status?: string | undefined;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  role?: AppRole | "system";
  category?:
    | "clinical"
    | "security"
    | "catalog"
    | "prescription"
    | "pharmacy"
    | "compliance";
  action: string;
  target: string;
  ip: string;
  status?: "success" | "warning" | "flagged" | "rejected";
  details?: string;
}
