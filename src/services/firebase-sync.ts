import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, handleFirestoreError } from "@/lib/firebase";
import type {
  Order,
  Reminder,
  Prescription,
  HealthProfile,
} from "@/lib/domain";

export async function syncOrderToFirestore(
  order: Order,
  userId: string = "user_default",
) {
  try {
    const ref = doc(db, "orders", order.id);
    await setDoc(
      ref,
      {
        id: order.id,
        userId,
        pharmacyId: order.pharmacyId,
        pharmacyName: order.pharmacyName,
        total: order.total,
        currency: "INR",
        fulfilment: order.fulfilment,
        status: order.status,
        placedAt: order.placedAt,
        items: order.items,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (err) {
    handleFirestoreError(err, "syncOrderToFirestore");
  }
}

export async function syncReminderToFirestore(
  reminder: Reminder,
  userId: string = "user_default",
) {
  try {
    const ref = doc(db, "reminders", reminder.id);
    await setDoc(
      ref,
      {
        id: reminder.id,
        userId,
        medicineName: reminder.medicineName,
        strength: reminder.strength,
        times: reminder.times,
        startDate: reminder.startDate,
        endDate: reminder.endDate ?? null,
        instruction: reminder.instruction,
        active: reminder.active,
        log: reminder.log,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (err) {
    handleFirestoreError(err, "syncReminderToFirestore");
  }
}

export async function syncPrescriptionToFirestore(
  rx: Prescription,
  userId: string = "user_default",
) {
  try {
    const ref = doc(db, "prescriptions", rx.id);
    await setDoc(
      ref,
      {
        id: rx.id,
        userId,
        fileName: rx.fileName,
        prescriberName: rx.prescriberName ?? null,
        status: rx.status,
        uploadedAt: rx.uploadedAt,
        items: rx.items,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (err) {
    handleFirestoreError(err, "syncPrescriptionToFirestore");
  }
}

export async function syncProfileToFirestore(
  profile: HealthProfile,
  userId: string = "user_default",
) {
  try {
    const ref = doc(db, "users", userId);
    await setDoc(
      ref,
      {
        userId,
        fullName: profile.fullName,
        email: profile.email,
        role: "patient",
        city: profile.city,
        allergies: profile.allergies,
        conditions: profile.conditions,
        currentMedicines: profile.currentMedicines,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (err) {
    handleFirestoreError(err, "syncProfileToFirestore");
  }
}
