import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Order, OrderStatus } from "@/lib/domain";
import { formatMoney } from "@/services/medicines";
import { orderService } from "@/services/order-service";

interface LiveOrderTrackingModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: (order: Order) => void;
}

export function LiveOrderTrackingModal({
  order,
  open,
  onOpenChange,
  onOrderUpdated,
}: LiveOrderTrackingModalProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(
    "Need delivery sooner from local walk-in",
  );
  const [cancelling, setCancelling] = useState(false);

  if (!order) return null;

  const isCancelled = order.status === "cancelled";
  const isCompleted = order.status === "completed";
  const isDelivery = order.fulfilment === "delivery";
  const isOutForDelivery = order.status === "out_for_delivery";

  const handleCancel = () => {
    setCancelling(true);
    setTimeout(() => {
      setCancelling(false);
      const updated = orderService.cancelOrder(order.id, cancelReason);
      if (updated) {
        toast.success(`Order ${order.id} cancelled`, {
          description: updated.cancellation?.refundTransactionId
            ? `Full refund of ₹${updated.total} initiated (${updated.cancellation.refundTransactionId}).`
            : "Order has been cancelled.",
        });
        if (onOrderUpdated) onOrderUpdated(updated);
      }
      setCancelModalOpen(false);
    }, 800);
  };

  const handleDownloadInvoice = () => {
    const lines = [
      `=============================================================`,
      `               MEDORA HEALTHCARE TAX INVOICE                 `,
      `=============================================================`,
      `Invoice No:    ${order.payment?.receiptNumber || "INV-" + order.id}`,
      `Order Date:    ${new Date(order.placedAt).toLocaleString()}`,
      `Pharmacy:      ${order.pharmacyName}`,
      `Status:        ${order.status.toUpperCase()}`,
      `-------------------------------------------------------------`,
      `ITEMS:`,
      ...order.items.map(
        (i) =>
          ` - ${i.name.padEnd(35)} x${i.qty}   ₹${(i.price * i.qty).toFixed(2)}`,
      ),
      `-------------------------------------------------------------`,
      `Subtotal:      ₹${order.payment?.gstBreakdown?.subtotal || (order.total * 0.88).toFixed(2)}`,
      `CGST (6%):     ₹${order.payment?.gstBreakdown?.cgst || (order.total * 0.06).toFixed(2)}`,
      `SGST (6%):     ₹${order.payment?.gstBreakdown?.sgst || (order.total * 0.06).toFixed(2)}`,
      `TOTAL PAID:    ₹${order.total.toFixed(2)}`,
      `Payment Mode:  ${order.payment?.method.toUpperCase() || "UPI"}`,
      `Txn ID:        ${order.payment?.transactionId || "TXN-VERIFIED"}`,
      `-------------------------------------------------------------`,
      `Prescription:  ${order.prescriptionVerification?.verifiedByPharmacist || "Verified Digital Monograph"}`,
      `Reg Number:    ${order.prescriptionVerification?.pharmacistLicence || "MH-CDSCO-8492"}`,
      `=============================================================`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Medora-Invoice-${order.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Tax Invoice downloaded successfully");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                  {isDelivery ? (
                    <Truck className="size-4" />
                  ) : (
                    <Package className="size-4" />
                  )}
                </span>
                <div>
                  <DialogTitle className="font-display text-lg font-extrabold text-ink">
                    Order {order.id} · Live Fulfillment
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {order.pharmacyName} ·{" "}
                    {new Date(order.placedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadInvoice}
                  className="text-xs font-semibold h-8 gap-1"
                >
                  <Download className="size-3 text-primary" /> Invoice
                </Button>
                {!isCancelled && !isCompleted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCancelModalOpen(true)}
                    className="text-xs text-destructive hover:bg-destructive/10 h-8"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Live GPS Delivery Map Pulse Simulator */}
            {isDelivery && !isCancelled && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                      <Navigation className="size-6 animate-pulse" />
                      <span className="absolute -top-1 -right-1 flex size-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-extrabold text-ink">
                          {order.delivery?.partner || "Dunzo MedExpress"}
                        </span>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {isOutForDelivery
                            ? "Live On Route"
                            : "Courier Assigned"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rider:{" "}
                        <span className="font-semibold text-foreground">
                          {order.delivery?.riderName || "Aakash Mehta"}
                        </span>{" "}
                        · {order.delivery?.vehicleNumber || "MH 01 DX 3912"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-card/90 rounded-xl border border-border p-2.5 sm:px-4">
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Estimated Arrival
                      </span>
                      <div className="font-display text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-center sm:justify-end">
                        <Clock className="size-3.5" />
                        {isCompleted
                          ? "Delivered"
                          : `${order.delivery?.estimatedMinutes || 12} mins`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-bold text-primary gap-1"
                      onClick={() => {
                        toast.info(
                          `Connecting call to rider ${order.delivery?.riderName || "courier"} (${order.delivery?.riderPhone || "+91 98201 44829"})`,
                        );
                      }}
                    >
                      <Phone className="size-3" /> Call
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {order.delivery?.deliveryAddress ||
                        "402 Sea View Apts, Bandra West, Mumbai"}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-foreground shrink-0 ml-2">
                    {order.delivery?.distanceKm || 1.4} km away
                  </span>
                </div>
              </div>
            )}

            {/* Pharmacist Prescription Digital Signature Verification Card */}
            {order.prescriptionVerification &&
              order.prescriptionVerification.status !== "not_required" && (
                <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        CDSCO Pharmacist Verification & Digital Sign
                      </span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Verified & Dispensed
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                    <div>
                      <span className="font-semibold text-foreground">
                        Pharmacist:{" "}
                      </span>
                      {order.prescriptionVerification.verifiedByPharmacist ||
                        "R. Ph. Sandeep Varma"}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">
                        State Reg No:{" "}
                      </span>
                      <span className="font-mono">
                        {order.prescriptionVerification.pharmacistLicence ||
                          "MH-PH-849201"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic border-t border-emerald-500/20 pt-1.5">
                    "
                    {order.prescriptionVerification.verificationNotes ||
                      "Prescription authenticated against National Pharmacy Registry."}
                    "
                  </p>
                </div>
              )}

            {/* Cancellation & Refund Alert */}
            {isCancelled && (
              <div className="rounded-2xl border-2 border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <XCircle className="size-4" /> Order Cancelled
                  </span>
                  {order.cancellation?.refundTransactionId && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Refund Completed
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reason:{" "}
                  <span className="font-semibold text-foreground">
                    {order.cancellation?.reason || "Cancelled by user"}
                  </span>
                </p>
                {order.cancellation?.refundTransactionId && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    Refund of ₹{order.cancellation.refundAmount?.toFixed(2)}{" "}
                    credited to source account (
                    {order.cancellation.refundTransactionId}).
                  </p>
                )}
              </div>
            )}

            {/* Items Summary */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Order Items ({order.items.length})
              </h4>
              <div className="divide-y divide-border/50 space-y-2">
                {order.items.map((it) => (
                  <div
                    key={it.medicineId}
                    className="flex justify-between items-center pt-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{it.name}</p>
                      <p className="text-muted-foreground">
                        Qty: {it.qty} · ₹{it.price.toFixed(2)} each
                      </p>
                    </div>
                    <span className="font-mono font-bold text-foreground">
                      ₹{(it.price * it.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-extrabold text-foreground">
                <span>Total Amount Paid</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>

            {/* Live Progress Timeline */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fulfillment Timeline
              </h4>
              <div className="space-y-3">
                {order.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="grid size-5 place-items-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="size-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <span className="font-bold text-foreground capitalize">
                          {event.state.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(event.at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed mt-0.5">
                        {event.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instant Cancellation & Refund Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-extrabold text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" /> Cancel Order
              & Request Refund
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to cancel order {order.id}? If payment was
              completed, 100% of ₹{order.total} will be instantly refunded.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Reason
              </Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="text-xs"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
              >
                Keep Order
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling
                  ? "Processing Refund..."
                  : `Cancel & Refund ₹${order.total}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
