import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  sendPasswordResetEmail,
  sendEmailVerification,
  type ActionCodeSettings,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { toast } from "sonner";
import firebaseConfig from "../../firebase-applet-config.json";

export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export function getActionCodeSettings(path: string): ActionCodeSettings {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://ais-dev-cmexn4gmk426mfxr76ushu-429810398216.asia-east1.run.app";
  return {
    url: `${origin}${path}`,
    handleCodeInApp: true,
  };
}

export async function sendFirebasePasswordReset(email: string) {
  try {
    const actionSettings = getActionCodeSettings("/reset-password");
    await sendPasswordResetEmail(auth, email, actionSettings);
    return { error: null };
  } catch (error) {
    console.error("Firebase sendPasswordResetEmail error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to dispatch reset email.";
    return { error: message };
  }
}

export async function sendFirebaseEmailVerification(user: FirebaseUser) {
  try {
    const actionSettings = getActionCodeSettings("/auth");
    await sendEmailVerification(user, actionSettings);
    return { error: null };
  } catch (error) {
    console.error("Firebase sendEmailVerification error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to dispatch verification email.";
    return { error: message };
  }
}

export function handleFirestoreError(error: unknown, context?: string) {
  console.error(`Firestore error${context ? ` in ${context}` : ""}:`, error);
  const message =
    error instanceof Error ? error.message : "Database operation failed";
  if (
    message.includes("permission-denied") ||
    message.includes("Missing or insufficient permissions")
  ) {
    toast.error(
      "Permission denied: You may need to sign in or have proper access rights.",
    );
  } else {
    toast.error(
      context
        ? `Error in ${context}`
        : "Failed to sync data with cloud database.",
    );
  }
}
