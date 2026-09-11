import { describe, expect, it } from "vitest";
import { notificationService } from "@/services/notification-service";

describe("Real Multi-Channel Notification System", () => {
  it("dispatches in-app, simulated email and SMS notifications", () => {
    const notif = notificationService.dispatch({
      title: "Test Alert",
      body: "Test notification body",
      kind: "order",
      channels: ["in_app", "email", "sms"],
      actionUrl: "/app/orders",
      actionLabel: "View Order",
    });

    expect(notif.id).toMatch(/^notif-/);
    expect(notif.title).toBe("Test Alert");
    expect(notif.read).toBe(false);
    expect(notif.channels).toContain("in_app");

    const logs = notificationService.getDeliveryLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((l) => l.title === "Test Alert")).toBe(true);
  });

  it("triggers specialized dose reminder alert", () => {
    notificationService.notifyDoseReminder(
      {
        id: "rem-test-01",
        medicineName: "Panacet",
        strength: "500mg",
        times: ["14:00"],
        startDate: "2026-08-20",
        endDate: "2026-08-27",
        instruction: "Take 1 tablet after lunch",
        active: true,
        log: [],
      },
      "2:00 PM",
    );

    const items = notificationService.getNotifications();
    const doseNotif = items.find((i) => i.title.includes("Panacet 500mg"));
    expect(doseNotif).toBeDefined();
    expect(doseNotif?.kind).toBe("reminder");
  });

  it("triggers price drop alert with percentage calculation", () => {
    notificationService.notifyPriceAlert(
      "Metformin 500mg",
      18,
      42.0,
      "Apollo Pharmacy",
    );
    const items = notificationService.getNotifications();
    const priceNotif = items.find((i) => i.title.includes("Price Dropped 18%"));
    expect(priceNotif).toBeDefined();
    expect(priceNotif?.kind).toBe("price");
  });

  it("triggers CDSCO clinical safety advisory alert", () => {
    notificationService.notifySafetyAlert(
      "Paracetamol Daily Maximum",
      "Do not exceed 4000mg in 24 hours.",
      "warning",
    );
    const items = notificationService.getNotifications();
    const safetyNotif = items.find((i) =>
      i.title.includes("Paracetamol Daily Maximum"),
    );
    expect(safetyNotif).toBeDefined();
    expect(safetyNotif?.kind).toBe("safety");
  });

  it("handles mark as read and delete actions", () => {
    const notif = notificationService.dispatch({
      title: "Temporary Notice",
      body: "Will be deleted",
      kind: "system",
    });

    notificationService.markAsRead(notif.id, true);
    let items = notificationService.getNotifications();
    expect(items.find((i) => i.id === notif.id)?.read).toBe(true);

    notificationService.deleteNotification(notif.id);
    items = notificationService.getNotifications();
    expect(items.find((i) => i.id === notif.id)).toBeUndefined();
  });
});
