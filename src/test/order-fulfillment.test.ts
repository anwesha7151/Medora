import { describe, expect, it } from "vitest";
import { orderService } from "@/services/order-service";

describe("Real Order + Payment + Fulfillment Engine", () => {
  it("creates a new order with payment and prescription gating", () => {
    const order = orderService.createOrder({
      pharmacyId: "ph-apollo-bandra",
      pharmacyName: "Apollo Pharmacy — Bandra West",
      items: [
        {
          medicineId: "med-paracetamol-500",
          name: "Panacet 500mg",
          qty: 2,
          price: 25.0,
          prescriptionOnly: false,
        },
      ],
      fulfilment: "delivery",
      paymentMethod: "upi",
    });

    expect(order.id).toMatch(/^ORD-\d{4}$/);
    expect(order.total).toBe(50.0);
    expect(order.payment?.status).toBe("completed");
    expect(order.payment?.transactionId).toMatch(/^TXN-UPI-/);
    expect(order.status).toBe("accepted");
    expect(order.delivery?.partner).toBe("Dunzo MedExpress");
  });

  it("handles pharmacist prescription digital signature verification", () => {
    const order = orderService.createOrder({
      pharmacyId: "ph-wellness-juhu",
      pharmacyName: "Wellness Forever — Juhu",
      items: [
        {
          medicineId: "med-metformin-500",
          name: "Glycomet 500mg SR",
          qty: 1,
          price: 40.0,
          prescriptionOnly: true,
        },
      ],
      fulfilment: "pickup",
      prescriptionId: "rx-test-01",
      paymentMethod: "card",
    });

    expect(order.status).toBe("verifying");

    const verified = orderService.verifyPrescription(order.id, {
      name: "R. Ph. Sandeep Varma",
      licence: "MH-PH-849201",
      approved: true,
      notes: "Valid Rx confirmed.",
    });

    expect(verified?.status).toBe("accepted");
    expect(verified?.prescriptionVerification?.status).toBe("approved");
    expect(verified?.prescriptionVerification?.verifiedByPharmacist).toBe(
      "R. Ph. Sandeep Varma",
    );
    expect(verified?.prescriptionVerification?.digitalSignature).toBeDefined();
  });

  it("dispatches and advances order to live delivery tracking", () => {
    const order = orderService.createOrder({
      pharmacyId: "ph-apollo-bandra",
      pharmacyName: "Apollo Pharmacy",
      items: [
        {
          medicineId: "med-cetirizine-10",
          name: "Alset 10mg",
          qty: 1,
          price: 30.0,
          prescriptionOnly: false,
        },
      ],
      fulfilment: "delivery",
      paymentMethod: "upi",
    });

    const dispatched = orderService.updateOrderStatus(
      order.id,
      "out_for_delivery",
      "Rider dispatched",
    );
    expect(dispatched?.status).toBe("out_for_delivery");
    expect(dispatched?.delivery?.estimatedMinutes).toBe(10);
  });

  it("handles instant cancellation and automated refund calculations", () => {
    const order = orderService.createOrder({
      pharmacyId: "ph-apollo-bandra",
      pharmacyName: "Apollo Pharmacy",
      items: [
        {
          medicineId: "med-paracetamol-500",
          name: "Panacet 500mg",
          qty: 1,
          price: 25.0,
          prescriptionOnly: false,
        },
      ],
      fulfilment: "delivery",
      paymentMethod: "upi",
    });

    const cancelled = orderService.cancelOrder(order.id, "Placed by mistake");
    expect(cancelled?.status).toBe("cancelled");
    expect(cancelled?.payment?.status).toBe("refunded");
    expect(cancelled?.cancellation?.refundStatus).toBe("refunded");
    expect(cancelled?.cancellation?.refundAmount).toBe(25.0);
    expect(cancelled?.cancellation?.refundTransactionId).toMatch(/^REF-/);
  });
});
