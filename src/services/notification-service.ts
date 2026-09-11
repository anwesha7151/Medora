/**
 * Medora Real Multi-Channel Notification Engine
 *
 * Provides real-time notification dispatching across:
 * 1. Web Push (HTML5 Browser Notification API + Web Audio Chime)
 * 2. Transactional Email Gateway (Simulated SMTP with formatted HTML templates & audit log)
 * 3. SMS Gateway (Simulated Twilio / Fast2SMS carrier delivery)
 * 4. In-App Notification Center (Reactive persistent state synchronized across tabs & workspaces)
 *
 * Supported Notification Categories:
 * - Order & Delivery Updates (Placed, Rx Endorsed, Out for Delivery, Delivered, Refunded)
 * - Medicine Dose Reminders (Time to take medication with 1-click adherence logging)
 * - Dynamic Price Drop Alerts (Monitored drug cost reductions)
 * - Clinical Safety Warnings (CDSCO black-box alerts, drug recalls, severe interactions)
 * - Pharmacy Operational Alerts (New incoming order, low inventory threshold)
 */

import type { NotificationItem, Order, Reminder } from "@/lib/domain";

const NOTIFICATIONS_STORAGE_KEY = "medora_notifications_v2";
const PREFS_STORAGE_KEY = "medora_notification_prefs_v1";
const LOGS_STORAGE_KEY = "medora_notification_delivery_logs_v1";

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  emailAddress: string;
  phoneNumber: string;
  categories: {
    orders: boolean;
    reminders: boolean;
    prices: boolean;
    safety: boolean;
    pharmacy: boolean;
  };
}

export interface DeliveryLogEntry {
  id: string;
  timestamp: string;
  channel: "in_app" | "push" | "email" | "sms";
  recipient: string;
  title: string;
  status: "delivered" | "failed" | "skipped";
  detail: string;
}

type NotificationSubscriber = (items: NotificationItem[]) => void;
const subscribers = new Set<NotificationSubscriber>();

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
  soundEnabled: true,
  emailAddress: "patient@medora.health",
  phoneNumber: "+91 98201 44829",
  categories: {
    orders: true,
    reminders: true,
    prices: true,
    safety: true,
    pharmacy: true,
  },
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-init-01",
    title: "⚡ Order Out for Delivery",
    body: "Dunzo MedExpress rider Kavish Sharma is en route with your medicines (Order ORD-9481). Estimated arrival: 8 mins.",
    at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    kind: "order",
    read: false,
    channels: ["in_app", "push", "sms"],
    actionUrl: "/app/orders",
    actionLabel: "Track Live GPS",
    meta: { orderId: "ORD-9481" },
  },
  {
    id: "notif-init-02",
    title: "💊 Dose Reminder: Panacet 500mg",
    body: "Time for your afternoon dose: 1 Tablet after lunch. Tap to mark as taken.",
    at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    kind: "reminder",
    read: false,
    channels: ["in_app", "push"],
    actionUrl: "/app/reminders",
    actionLabel: "Log Dose Taken",
  },
  {
    id: "notif-init-03",
    title: "🏷️ Price Drop Alert: Glycomet 500mg SR",
    body: "Price dropped 18% at Wellness Forever Juhu (now ₹42.00 vs ₹51.50). 3 pharmacies currently in stock.",
    at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    kind: "price",
    read: true,
    channels: ["in_app", "email"],
    actionUrl: "/app/search",
    actionLabel: "Compare Prices",
    meta: { medicineId: "med-metformin-500", priceDropPercent: 18 },
  },
  {
    id: "notif-init-04",
    title: "⚠️ CDSCO Advisory: Paracetamol Daily Limit",
    body: "Ensure cumulative acetaminophen intake does not exceed 4,000 mg within 24 hours across combination cold/flu products.",
    at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    kind: "safety",
    read: true,
    channels: ["in_app", "email"],
    actionUrl: "/app/assistant",
    actionLabel: "Consult PharmAI",
    meta: { severity: "warning" },
  },
];

class NotificationService {
  private notificationsCache: NotificationItem[] | null = null;
  private prefsCache: NotificationPreferences | null = null;
  private logsCache: DeliveryLogEntry[] | null = null;

  // Web Audio Chime synthesizer for instant in-browser sound alerts
  private playChime() {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  public getPreferences(): NotificationPreferences {
    if (this.prefsCache) return this.prefsCache;
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    try {
      const stored = window.localStorage.getItem(PREFS_STORAGE_KEY);
      if (stored) {
        this.prefsCache = JSON.parse(stored);
        return this.prefsCache || DEFAULT_PREFERENCES;
      }
    } catch (e) {
      console.warn("Failed reading notification preferences:", e);
    }
    this.prefsCache = DEFAULT_PREFERENCES;
    return DEFAULT_PREFERENCES;
  }

  public savePreferences(prefs: NotificationPreferences): void {
    this.prefsCache = prefs;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
      } catch (e) {
        console.warn("Failed saving notification preferences:", e);
      }
    }
  }

  public async requestBrowserPushPermission(): Promise<NotificationPermission> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    const permission = await Notification.requestPermission();
    const prefs = this.getPreferences();
    this.savePreferences({
      ...prefs,
      pushEnabled: permission === "granted",
    });
    return permission;
  }

  public getNotifications(): NotificationItem[] {
    if (this.notificationsCache) return this.notificationsCache;
    if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;

    try {
      const stored = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notificationsCache = JSON.parse(stored);
        return this.notificationsCache || [];
      }
    } catch (e) {
      console.warn("Failed loading notifications:", e);
    }

    this.notificationsCache = INITIAL_NOTIFICATIONS;
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    return INITIAL_NOTIFICATIONS;
  }

  private saveNotifications(items: NotificationItem[]): void {
    this.notificationsCache = items;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          NOTIFICATIONS_STORAGE_KEY,
          JSON.stringify(items),
        );
      } catch (e) {
        console.warn("Failed saving notifications:", e);
      }
    }
    subscribers.forEach((fn) => {
      try {
        fn(items);
      } catch (e) {
        console.warn("Subscriber error:", e);
      }
    });
  }

  public getDeliveryLogs(): DeliveryLogEntry[] {
    if (this.logsCache) return this.logsCache;
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(LOGS_STORAGE_KEY);
      if (stored) {
        this.logsCache = JSON.parse(stored);
        return this.logsCache || [];
      }
    } catch {}
    return [];
  }

  private logDelivery(entry: Omit<DeliveryLogEntry, "id" | "timestamp">) {
    const logs = this.getDeliveryLogs();
    const newLog: DeliveryLogEntry = {
      id: `LOG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    const next = [newLog, ...logs].slice(0, 100);
    this.logsCache = next;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
    }
  }

  public subscribe(fn: NotificationSubscriber): () => void {
    subscribers.add(fn);
    fn(this.getNotifications());
    return () => subscribers.delete(fn);
  }

  public markAsRead(id: string, read: boolean = true): void {
    const current = this.getNotifications();
    const next = current.map((n) => (n.id === id ? { ...n, read } : n));
    this.saveNotifications(next);
  }

  public markAllAsRead(): void {
    const current = this.getNotifications();
    const next = current.map((n) => ({ ...n, read: true }));
    this.saveNotifications(next);
  }

  public deleteNotification(id: string): void {
    const current = this.getNotifications();
    const next = current.filter((n) => n.id !== id);
    this.saveNotifications(next);
  }

  public dispatch(payload: {
    title: string;
    body: string;
    kind: NotificationItem["kind"];
    actionUrl?: string;
    actionLabel?: string;
    meta?: NotificationItem["meta"];
    channels?: ("in_app" | "push" | "email" | "sms")[];
  }): NotificationItem {
    const prefs = this.getPreferences();
    const now = new Date().toISOString();
    const id = `notif-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const targetChannels = payload.channels || [
      "in_app",
      "push",
      "email",
      "sms",
    ];
    const activeChannels: ("in_app" | "push" | "email" | "sms")[] = ["in_app"];

    // 1. In-App Notification
    const newItem: NotificationItem = {
      id,
      title: payload.title,
      body: payload.body,
      at: now,
      kind: payload.kind,
      read: false,
      channels: activeChannels,
      actionUrl: payload.actionUrl,
      actionLabel: payload.actionLabel,
      meta: payload.meta,
    };

    const current = this.getNotifications();
    this.saveNotifications([newItem, ...current]);
    this.logDelivery({
      channel: "in_app",
      recipient: "Current Active User",
      title: payload.title,
      status: "delivered",
      detail: "In-App UI Badge & Drawer Notification Broadcasted.",
    });

    // 2. Sound alert if enabled
    if (prefs.soundEnabled) {
      this.playChime();
    }

    // 3. Browser Web Push
    if (targetChannels.includes("push") && prefs.pushEnabled) {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const n = new Notification(payload.title, {
            body: payload.body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: id,
          });
          if (payload.actionUrl) {
            n.onclick = () => {
              window.focus();
              window.location.href = payload.actionUrl!;
            };
          }
          activeChannels.push("push");
          this.logDelivery({
            channel: "push",
            recipient: "Web Browser Client",
            title: payload.title,
            status: "delivered",
            detail: "HTML5 Web Notification API fired successfully.",
          });
        } catch (e) {
          this.logDelivery({
            channel: "push",
            recipient: "Web Browser Client",
            title: payload.title,
            status: "failed",
            detail: `Push dispatch failed: ${String(e)}`,
          });
        }
      } else {
        this.logDelivery({
          channel: "push",
          recipient: "Web Browser Client",
          title: payload.title,
          status: "skipped",
          detail: "Push permission not granted or disabled in preferences.",
        });
      }
    }

    // 4. Transactional Email Simulation
    if (
      targetChannels.includes("email") &&
      prefs.emailEnabled &&
      prefs.emailAddress
    ) {
      activeChannels.push("email");
      this.logDelivery({
        channel: "email",
        recipient: prefs.emailAddress,
        title: payload.title,
        status: "delivered",
        detail: `SMTP Relayed to ${prefs.emailAddress} via Medora Postmark Gateway (200 OK).`,
      });
    }

    // 5. SMS Carrier Simulation
    if (
      targetChannels.includes("sms") &&
      prefs.smsEnabled &&
      prefs.phoneNumber
    ) {
      activeChannels.push("sms");
      this.logDelivery({
        channel: "sms",
        recipient: prefs.phoneNumber,
        title: payload.title,
        status: "delivered",
        detail: `Fast2SMS / Twilio Carrier delivered to ${prefs.phoneNumber} (DLR: SUCCESS).`,
      });
    }

    newItem.channels = activeChannels;
    return newItem;
  }

  // --- Specialized Triggers ---

  public notifyOrderPlaced(order: Order): void {
    this.dispatch({
      title: `🛍️ Order ${order.id} Placed & Confirmed`,
      body: `Your order for ₹${order.total.toFixed(2)} at ${order.pharmacyName} is confirmed. Payment verified via ${order.payment?.method.toUpperCase() || "UPI"}.`,
      kind: "order",
      actionUrl: "/app/orders",
      actionLabel: "View Order",
      meta: { orderId: order.id },
      channels: ["in_app", "push", "email", "sms"],
    });
  }

  public notifyPrescriptionVerified(
    order: Order,
    pharmacistName: string,
  ): void {
    this.dispatch({
      title: `📋 Prescription Endorsed by Pharmacist`,
      body: `${pharmacistName} has validated and digitally signed your prescription for Order ${order.id}. Medicine packing has started.`,
      kind: "order",
      actionUrl: "/app/orders",
      actionLabel: "View Order",
      meta: { orderId: order.id },
      channels: ["in_app", "push", "email"],
    });
  }

  public notifyOutForDelivery(order: Order): void {
    this.dispatch({
      title: `⚡ Dunzo Rider Assigned · Order ${order.id}`,
      body: `Rider ${order.delivery?.riderName || "Aakash Mehta"} has picked up your medicine package from ${order.pharmacyName}. ETA ~${order.delivery?.estimatedMinutes || 10} mins.`,
      kind: "order",
      actionUrl: "/app/orders",
      actionLabel: "Track Live GPS",
      meta: { orderId: order.id },
      channels: ["in_app", "push", "sms"],
    });
  }

  public notifyOrderDelivered(order: Order): void {
    this.dispatch({
      title: `✓ Order ${order.id} Delivered Successfully`,
      body: `Your medications have been delivered by ${order.delivery?.partner || "Dunzo Express"}. Digital tax invoice is ready for download.`,
      kind: "order",
      actionUrl: "/app/orders",
      actionLabel: "Download Tax Invoice",
      meta: { orderId: order.id },
      channels: ["in_app", "push", "email", "sms"],
    });
  }

  public notifyOrderCancelled(order: Order): void {
    this.dispatch({
      title: `🔄 Order ${order.id} Cancelled & Refund Initiated`,
      body: `Your order was cancelled. 100% refund of ₹${order.total.toFixed(2)} credited back to source (${order.cancellation?.refundTransactionId || "REF-INSTANT"}).`,
      kind: "order",
      actionUrl: "/app/orders",
      actionLabel: "View Refund Status",
      meta: { orderId: order.id },
      channels: ["in_app", "push", "email", "sms"],
    });
  }

  public notifyDoseReminder(reminder: Reminder, scheduledTime: string): void {
    this.dispatch({
      title: `⏰ Medicine Time: ${reminder.medicineName} ${reminder.strength}`,
      body: `Scheduled dose (${scheduledTime}): ${reminder.instruction || "Take 1 dose with water"}. Tap to record adherence.`,
      kind: "reminder",
      actionUrl: "/app/reminders",
      actionLabel: "Mark as Taken",
      channels: ["in_app", "push"],
    });
  }

  public notifyPriceAlert(
    medicineName: string,
    dropPercent: number,
    lowestPrice: number,
    pharmacyName: string,
  ): void {
    this.dispatch({
      title: `📉 Price Dropped ${dropPercent}% on ${medicineName}`,
      body: `Now available for ₹${lowestPrice.toFixed(2)} at ${pharmacyName}. Save on your next prescription refill.`,
      kind: "price",
      actionUrl: "/app/search",
      actionLabel: "Reserve at Pharmacy",
      channels: ["in_app", "push", "email"],
    });
  }

  public notifySafetyAlert(
    title: string,
    detail: string,
    severity: "info" | "warning" | "critical",
  ): void {
    this.dispatch({
      title: `⚠️ Safety Advisory: ${title}`,
      body: detail,
      kind: "safety",
      actionUrl: "/app/assistant",
      actionLabel: "Clinical Consultation",
      meta: { severity },
      channels: ["in_app", "push", "email", "sms"],
    });
  }

  public notifyPharmacyAlert(
    title: string,
    detail: string,
    actionUrl?: string,
  ): void {
    this.dispatch({
      title: `🏪 Pharmacy Alert: ${title}`,
      body: detail,
      kind: "pharmacy",
      actionUrl: actionUrl || "/pharmacy/orders",
      actionLabel: "Open Dispensing Queue",
      channels: ["in_app", "push"],
    });
  }
}

export const notificationService = new NotificationService();
