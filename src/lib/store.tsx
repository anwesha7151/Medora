import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { demoLabReport, demoPrescriptions } from "@/data/demo-catalog";
import {
  syncOrderToPostgres,
  syncReminderToPostgres,
  syncPrescriptionToPostgres,
  syncLabReportToPostgres,
  syncProfileToPostgres,
} from "@/services/db-sync";
import {
  syncOrderToFirestore,
  syncReminderToFirestore,
  syncPrescriptionToFirestore,
  syncProfileToFirestore,
} from "@/services/firebase-sync";
import type {
  AppRole,
  ClinicalNote,
  ComparisonRecord,
  HealthProfile,
  LabReport,
  NotificationItem,
  Order,
  OrderItem,
  OrderStatus,
  Prescription,
  Reminder,
  UserActivityItem,
} from "@/lib/domain";

const STORAGE_KEY = "medora.state.v1";

export interface AppState {
  signedIn: boolean;
  onboarded: boolean;
  role: AppRole;
  profile: HealthProfile;
  prescriptions: Prescription[];
  reminders: Reminder[];
  comparisons: ComparisonRecord[];
  orders: Order[];
  cart: OrderItem[];
  labReports: LabReport[];
  notifications: NotificationItem[];
  compareSelection: string[];
  activities: UserActivityItem[];
  clinicalNotes: ClinicalNote[];
}

const today = () => new Date().toISOString().slice(0, 10);

const defaultProfile: HealthProfile = {
  fullName: "Tribhuwan",
  email: "tribhuwan@example.com",
  ageBand: "30–39",
  sex: "Male",
  city: "Bengaluru",
  allergies: ["Penicillin (self-reported)"],
  conditions: ["Type 2 diabetes (self-reported)"],
  currentMedicines: ["Glycomet 500 SR", "Pan-D Capsule"],
  pregnancyStatus: "Not applicable",
  consentInformationalUse: true,
  consentDataProcessing: true,
  shareLocation: false,
};

const defaultReminders: Reminder[] = [
  {
    id: "rem-1",
    medicineName: "Glycomet 500 SR",
    strength: "500 mg",
    times: ["08:00", "20:00"],
    startDate: "2026-08-02",
    endDate: "2026-09-01",
    instruction: "Take 1 tablet after meals (breakfast and dinner).",
    sourcePrescriptionId: "rx-1002",
    active: true,
    log: [
      { date: today(), time: "08:00", state: "taken" },
      { date: "2026-08-12", time: "08:00", state: "taken" },
      { date: "2026-08-12", time: "20:00", state: "skipped" },
      { date: "2026-08-11", time: "08:00", state: "taken" },
      { date: "2026-08-11", time: "20:00", state: "taken" },
    ],
  },
  {
    id: "rem-2",
    medicineName: "Pan-D Capsule",
    strength: "40 mg / 30 mg",
    times: ["07:30"],
    startDate: "2026-08-05",
    endDate: "2026-08-25",
    instruction:
      "Take 1 capsule 30 minutes before breakfast on an empty stomach.",
    sourcePrescriptionId: "rx-1001",
    active: true,
    log: [{ date: today(), time: "07:30", state: "taken" }],
  },
];

const defaultNotifications: NotificationItem[] = [
  {
    id: "nt-1",
    title: "Reminder due at 20:00",
    body: "Glycomet 500 SR — take after dinner and mark it taken or skipped.",
    at: "2026-08-14T18:30:00.000Z",
    kind: "reminder",
    read: false,
  },
  {
    id: "nt-2",
    title: "Price comparison update",
    body: "Paracetamol 650 mg: lowest listing is Pacimol 650 at ₹26.50 vs Dolo 650 at ₹34.00 (₹7.50 difference per pack).",
    at: "2026-08-14T09:12:00.000Z",
    kind: "price",
    read: false,
  },
  {
    id: "nt-3",
    title: "Safety notice",
    body: "You recorded a penicillin allergy. Show it to your pharmacist before any antibiotic (like Augmentin) is dispensed.",
    at: "2026-08-11T14:00:00.000Z",
    kind: "safety",
    read: true,
  },
  {
    id: "nt-4",
    title: "Reservation ready for pickup",
    body: "Order MD-4821 at Apollo Pharmacy (24x7) is ready at the counter.",
    at: "2026-08-13T16:45:00.000Z",
    kind: "order",
    read: true,
  },
];

const defaultOrders: Order[] = [
  {
    id: "MD-4821",
    pharmacyId: "ph-1",
    pharmacyName: "Apollo Pharmacy (24x7)",
    placedAt: "2026-08-13T15:02:00.000Z",
    items: [
      {
        medicineId: "med-pan-d-cap-a",
        name: "Pan-D · 15 Capsules",
        qty: 1,
        price: 198.0,
        prescriptionOnly: true,
      },
    ],
    total: 198.0,
    fulfilment: "pickup",
    status: "ready",
    timeline: [
      {
        state: "accepted",
        at: "2026-08-13T15:04:00.000Z",
        note: "Pharmacy accepted the prescription order.",
      },
      {
        state: "preparing",
        at: "2026-08-13T15:40:00.000Z",
        note: "Verified by registered pharmacist and packed.",
      },
      {
        state: "ready",
        at: "2026-08-13T16:45:00.000Z",
        note: "Ready at the express pickup counter.",
      },
    ],
  },
  {
    id: "MD-4787",
    pharmacyId: "ph-3",
    pharmacyName: "Tata 1mg Health Store (24h)",
    placedAt: "2026-08-10T11:20:00.000Z",
    items: [
      {
        medicineId: "med-glyco-500-tab-a",
        name: "Glycomet 500 SR · 20 Tablets",
        qty: 2,
        price: 90.0,
        prescriptionOnly: true,
      },
    ],
    total: 90.0,
    fulfilment: "pickup",
    prescriptionId: "rx-1002",
    status: "completed",
    timeline: [
      {
        state: "verifying",
        at: "2026-08-10T11:22:00.000Z",
        note: "Prescription sent for pharmacist verification.",
      },
      {
        state: "accepted",
        at: "2026-08-10T12:05:00.000Z",
        note: "Pharmacist verified the refill prescription.",
      },
      {
        state: "ready",
        at: "2026-08-10T13:10:00.000Z",
        note: "Ready for pickup.",
      },
      {
        state: "completed",
        at: "2026-08-10T17:30:00.000Z",
        note: "Dispensed and collected at store.",
      },
    ],
  },
];

const defaultComparisons: ComparisonRecord[] = [
  {
    id: "cmp-1",
    createdAt: "2026-08-12T10:00:00.000Z",
    compositionKey: "paracetamol|650 mg|Tablet",
    label: "Paracetamol 650 mg · Tablet",
    medicineIds: [
      "med-dolo-650-tab",
      "med-calpol-650-tab",
      "med-crocin-650-tab",
      "med-pacimol-650-tab",
    ],
    lowest: 26.5,
    highest: 35.5,
  },
  {
    id: "cmp-2",
    createdAt: "2026-08-06T18:20:00.000Z",
    compositionKey: "amoxicillin+clavulanate|625 mg|Tablet",
    label: "Amoxicillin + Clavulanate 625 mg · Tablet",
    medicineIds: [
      "med-augm-625-tab-a",
      "med-moxi-625-tab-b",
      "med-clavam-625-tab-c",
    ],
    lowest: 172.0,
    highest: 204.0,
  },
];

const defaultActivities: UserActivityItem[] = [
  {
    id: "act-1",
    action: "search",
    title: "Searched 'Paracetamol 650 mg'",
    detail: "Viewed 4 equivalent brand matches and price comparisons.",
    timestamp: "2026-08-14T09:12:00.000Z",
  },
  {
    id: "act-2",
    action: "view_medicine",
    title: "Viewed Monograph: Dolo 650",
    detail: "Checked composition, side effects, and dispensing criteria.",
    timestamp: "2026-08-14T09:15:00.000Z",
  },
  {
    id: "act-3",
    action: "compare",
    title: "Compared Paracetamol Brands",
    detail: "Compared Dolo 650, Calpol 650, Crocin 650 and Pacimol 650.",
    timestamp: "2026-08-12T10:00:00.000Z",
  },
  {
    id: "act-4",
    action: "scan",
    title: "Verified Pack: Glycomet 500 SR",
    detail: "Optical barcode check verified against verified catalog.",
    timestamp: "2026-08-10T11:22:00.000Z",
  },
];

const defaultClinicalNotes: ClinicalNote[] = [
  {
    id: "note-1",
    patientId: "pat-1",
    patientName: "Aarav Sharma",
    author: "Dr. Ananya Roy",
    content:
      "Reviewed fasting blood glucose and HbA1c. Continue Metformin 500mg SR with dinner. Repeat lipid profile in 3 months.",
    category: "decision",
    timestamp: "2026-08-16T10:30:00.000Z",
  },
  {
    id: "note-2",
    patientId: "pat-2",
    patientName: "Priya Nair",
    author: "Dr. Ananya Roy",
    content:
      "Patient reports mild epigastric discomfort. Prescribed Pantoprazole 40mg before breakfast for 14 days.",
    category: "consult",
    timestamp: "2026-08-15T14:15:00.000Z",
  },
];

const initialState: AppState = {
  signedIn: false,
  onboarded: false,
  role: "patient",
  profile: defaultProfile,
  prescriptions: demoPrescriptions,
  reminders: defaultReminders,
  comparisons: defaultComparisons,
  orders: defaultOrders,
  cart: [],
  labReports: [demoLabReport],
  notifications: defaultNotifications,
  compareSelection: [],
  activities: defaultActivities,
  clinicalNotes: defaultClinicalNotes,
};

interface StoreValue {
  state: AppState;
  update: (
    patch: Partial<AppState> | ((prev: AppState) => Partial<AppState>),
  ) => void;
  signIn: (role?: AppRole) => void;
  signOut: () => void;
  toggleCompare: (medicineId: string) => void;
  clearCompare: () => void;
  addToCart: (item: OrderItem) => void;
  removeFromCart: (medicineId: string) => void;
  setCartQty: (medicineId: string, qty: number) => void;
  placeOrder: (
    pharmacyId: string,
    pharmacyName: string,
    fulfilment: "pickup" | "delivery",
    prescriptionId?: string,
  ) => Order;
  advanceOrder: (orderId: string, status: OrderStatus, note: string) => void;
  savePrescription: (rx: Prescription) => void;
  addReminder: (r: Reminder) => void;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  logDose: (id: string, time: string, state: "taken" | "skipped") => void;
  saveComparison: (record: ComparisonRecord) => void;
  markNotification: (id: string, read: boolean) => void;
  markAllNotificationsRead: () => void;
  pushNotification: (n: Omit<NotificationItem, "id" | "at" | "read">) => void;
  addLabReport: (r: LabReport) => void;
  logActivity: (item: Omit<UserActivityItem, "id" | "timestamp">) => void;
  saveClinicalNote: (note: Omit<ClinicalNote, "id" | "timestamp">) => void;
  clearActivities: () => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as AppState) });
    } catch {
      /* ignore corrupt local state and continue with defaults */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable; state stays in memory */
    }
  }, [state, hydrated]);

  const update = useCallback<StoreValue["update"]>((patch) => {
    setState((prev) => ({
      ...prev,
      ...(typeof patch === "function" ? patch(prev) : patch),
    }));
  }, []);

  const value = useMemo<StoreValue>(() => {
    const nowIso = () => new Date().toISOString();
    return {
      state,
      update,
      signIn: (role = "patient") =>
        setState((p) => ({
          ...p,
          signedIn: true,
          role,
          onboarded: p.onboarded || role !== "patient",
        })),
      signOut: () =>
        setState((p) => ({ ...p, signedIn: false, role: "patient", cart: [] })),
      toggleCompare: (id) =>
        setState((p) => ({
          ...p,
          compareSelection: p.compareSelection.includes(id)
            ? p.compareSelection.filter((x) => x !== id)
            : [...p.compareSelection, id],
        })),
      clearCompare: () => setState((p) => ({ ...p, compareSelection: [] })),
      addToCart: (item) =>
        setState((p) => {
          const existing = p.cart.find((c) => c.medicineId === item.medicineId);
          return {
            ...p,
            cart: existing
              ? p.cart.map((c) =>
                  c.medicineId === item.medicineId
                    ? { ...c, qty: c.qty + item.qty }
                    : c,
                )
              : [...p.cart, item],
          };
        }),
      removeFromCart: (medicineId) =>
        setState((p) => ({
          ...p,
          cart: p.cart.filter((c) => c.medicineId !== medicineId),
        })),
      setCartQty: (medicineId, qty) =>
        setState((p) => ({
          ...p,
          cart: p.cart.map((c) =>
            c.medicineId === medicineId ? { ...c, qty: Math.max(1, qty) } : c,
          ),
        })),
      placeOrder: (pharmacyId, pharmacyName, fulfilment, prescriptionId) => {
        const items = state.cart;
        const needsRx = items.some((i) => i.prescriptionOnly);
        const status: OrderStatus = needsRx
          ? prescriptionId
            ? "verifying"
            : "awaiting_prescription"
          : "accepted";
        const order: Order = {
          id: `MD-${Math.floor(1000 + Math.random() * 8999)}`,
          pharmacyId,
          pharmacyName,
          placedAt: nowIso(),
          items,
          total: items.reduce((s, i) => s + i.price * i.qty, 0),
          fulfilment,
          ...(prescriptionId ? { prescriptionId } : {}),
          status,
          timeline: [
            {
              state: status,
              at: nowIso(),
              note:
                status === "awaiting_prescription"
                  ? "A prescription is required before this order can be verified."
                  : status === "verifying"
                    ? "Prescription submitted for pharmacist verification."
                    : "Reservation received by the pharmacy (demo mode).",
            },
          ],
        };
        setState((p) => ({ ...p, orders: [order, ...p.orders], cart: [] }));
        void syncOrderToPostgres(order);
        void syncOrderToFirestore(order);
        return order;
      },
      advanceOrder: (orderId, status, note) =>
        setState((p) => {
          const updatedOrders = p.orders.map((o) => {
            if (o.id !== orderId) return o;
            const updated = {
              ...o,
              status,
              timeline: [...o.timeline, { state: status, at: nowIso(), note }],
            };
            void syncOrderToPostgres(updated);
            void syncOrderToFirestore(updated);
            return updated;
          });
          return { ...p, orders: updatedOrders };
        }),
      savePrescription: (rx) => {
        setState((p) => ({
          ...p,
          prescriptions: [rx, ...p.prescriptions.filter((x) => x.id !== rx.id)],
        }));
        void syncPrescriptionToPostgres(rx);
        void syncPrescriptionToFirestore(rx);
      },
      addReminder: (r) => {
        setState((p) => ({ ...p, reminders: [r, ...p.reminders] }));
        void syncReminderToPostgres(r);
        void syncReminderToFirestore(r);
      },
      updateReminder: (id, patch) => {
        setState((p) => {
          const updatedReminders = p.reminders.map((r) => {
            if (r.id !== id) return r;
            const updated = { ...r, ...patch };
            void syncReminderToPostgres(updated);
            void syncReminderToFirestore(updated);
            return updated;
          });
          return { ...p, reminders: updatedReminders };
        });
      },
      deleteReminder: (id) => {
        setState((p) => ({
          ...p,
          reminders: p.reminders.filter((r) => r.id !== id),
        }));
      },
      logDose: (id, time, doseState) => {
        setState((p) => {
          const updatedReminders = p.reminders.map((r) => {
            if (r.id !== id) return r;
            const updated = {
              ...r,
              log: [
                { date: today(), time, state: doseState },
                ...r.log.filter(
                  (l) => !(l.date === today() && l.time === time),
                ),
              ],
            };
            void syncReminderToPostgres(updated);
            void syncReminderToFirestore(updated);
            return updated;
          });
          return { ...p, reminders: updatedReminders };
        });
      },
      saveComparison: (record) =>
        setState((p) => ({
          ...p,
          comparisons: [
            record,
            ...p.comparisons.filter(
              (c) => c.compositionKey !== record.compositionKey,
            ),
          ].slice(0, 8),
        })),
      markNotification: (id, read) =>
        setState((p) => ({
          ...p,
          notifications: p.notifications.map((n) =>
            n.id === id ? { ...n, read } : n,
          ),
        })),
      markAllNotificationsRead: () =>
        setState((p) => ({
          ...p,
          notifications: p.notifications.map((n) => ({ ...n, read: true })),
        })),
      pushNotification: (n) =>
        setState((p) => ({
          ...p,
          notifications: [
            {
              ...n,
              id: `nt-${Math.random().toString(36).slice(2, 8)}`,
              at: nowIso(),
              read: false,
            },
            ...p.notifications,
          ],
        })),
      addLabReport: (r) => {
        setState((p) => ({ ...p, labReports: [r, ...p.labReports] }));
        void syncLabReportToPostgres(r);
      },
      logActivity: (item) => {
        setState((p) => ({
          ...p,
          activities: [
            {
              ...item,
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: nowIso(),
            },
            ...(p.activities ?? []),
          ].slice(0, 50),
        }));
      },
      saveClinicalNote: (note) => {
        setState((p) => ({
          ...p,
          clinicalNotes: [
            {
              ...note,
              id: `cn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: nowIso(),
            },
            ...(p.clinicalNotes ?? []),
          ],
        }));
      },
      clearActivities: () => {
        setState((p) => ({ ...p, activities: [] }));
      },
      resetDemo: () => setState(initialState),
    };
  }, [state, update]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

/** Returns the store if a provider is mounted above, otherwise null. */
export function useOptionalStore() {
  return useContext(StoreContext);
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <AppStoreProvider>");
  return ctx;
}

export const adherenceRate = (reminders: Reminder[]) => {
  const logs = reminders.flatMap((r) => r.log);
  if (!logs.length) return null;
  return Math.round(
    (logs.filter((l) => l.state === "taken").length / logs.length) * 100,
  );
};
