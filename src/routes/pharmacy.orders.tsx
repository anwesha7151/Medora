import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import { StatusPill, WorkspaceSection } from "@/components/workspace/parts";
import type { Order, OrderStatus } from "@/lib/domain";
import { formatMoney } from "@/services/medicines";
import { orderService } from "@/services/order-service";

export const Route = createFileRoute("/pharmacy/orders")({
  head: () => ({
    meta: [
      { title: "Pharmacy Orders & Live Fulfillment — Medora" },
      {
        name: "description",
        content:
          "Live pharmacy dispensing console: verify prescriptions with digital signatures, advance packing, and dispatch to Dunzo/Shadowfax couriers.",
      },
      {
        property: "og:title",
        content: "Pharmacy Orders & Live Fulfillment — Medora",
      },
      {
        property: "og:description",
        content: "Live pharmacist order queue and courier dispatch portal.",
      },
    ],
  }),
  component: OrdersPage,
});

const statusTone: Record<
  OrderStatus,
  {
    label: string;
    tone: "neutral" | "positive" | "warning" | "danger" | "info";
  }
> = {
  awaiting_prescription: { label: "Awaiting Prescription", tone: "warning" },
  verifying: { label: "Verification Required", tone: "info" },
  accepted: { label: "Accepted", tone: "neutral" },
  preparing: { label: "Packing Order", tone: "neutral" },
  ready: { label: "Ready for Dispatch", tone: "positive" },
  out_for_delivery: { label: "⚡ Out for Delivery", tone: "positive" },
  completed: { label: "Completed", tone: "positive" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewing, setViewing] = useState<Order | null>(null);

  // Pharmacist Prescription Verification Modal
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [pharmacistName, setPharmacistName] = useState("R. Ph. Sandeep Varma");
  const [licenceNo, setLicenceNo] = useState("MH-PH-849201");
  const [rxNotes, setRxNotes] = useState(
    "Verified dosage, frequency and scheduled drug compliance with CDSCO guidelines.",
  );
  const [rxApproved, setRxApproved] = useState(true);

  // Courier Dispatch Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [courierPartner, setCourierPartner] = useState("Dunzo MedExpress");
  const [riderName, setRiderName] = useState("Kavish Sharma");
  const [riderPhone, setRiderPhone] = useState("+91 98201 44829");
  const [vehicleNo, setVehicleNo] = useState("MH 02 CB 4921");

  useEffect(() => {
    const unsub = orderService.subscribe((data) => {
      setOrders([...data]);
      if (viewing) {
        const fresh = data.find((o) => o.id === viewing.id);
        if (fresh) setViewing(fresh);
      }
    });
    return unsub;
  }, [viewing?.id]);

  const handleVerifyPrescription = () => {
    if (!viewing) return;
    const updated = orderService.verifyPrescription(viewing.id, {
      name: pharmacistName,
      licence: licenceNo,
      approved: rxApproved,
      notes: rxNotes,
    });
    if (updated) {
      setViewing(updated);
      toast.success(
        rxApproved
          ? `Prescription digitally signed & approved for Order ${viewing.id}`
          : `Prescription rejected for Order ${viewing.id}`,
      );
    }
    setRxModalOpen(false);
  };

  const handleAdvanceStatus = (next: OrderStatus, note?: string) => {
    if (!viewing) return;
    const updated = orderService.updateOrderStatus(viewing.id, next, note);
    if (updated) {
      setViewing(updated);
      toast.success(`Order ${viewing.id} marked as ${next.replace(/_/g, " ")}`);
    }
  };

  const handleDispatchCourier = () => {
    if (!viewing) return;
    const updated = orderService.updateOrderStatus(
      viewing.id,
      "out_for_delivery",
      `Dispatched via ${courierPartner} (Rider: ${riderName}, ${vehicleNo}). Live GPS active.`,
    );
    if (updated) {
      setViewing(updated);
      toast.success(`Order ${viewing.id} dispatched with live GPS tracking!`);
    }
    setDispatchModalOpen(false);
  };

  const columns: DataColumn<Order>[] = useMemo(
    () => [
      {
        key: "id",
        header: "Order",
        sortValue: (r) => r.id,
        render: (r) => (
          <div>
            <p className="font-bold text-ink">{r.id}</p>
            <p className="text-xs text-muted-foreground">
              {r.fulfilment === "delivery" ? "⚡ Delivery" : "🏪 Counter"}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => r.status,
        render: (r) => {
          const m = statusTone[r.status];
          return <StatusPill tone={m.tone}>{m.label}</StatusPill>;
        },
      },
      {
        key: "items",
        header: "Prescription / Items",
        render: (r) => (
          <div className="max-w-[240px]">
            <p className="font-medium text-ink truncate text-xs">
              {r.items.map((i) => `${i.name} (x${i.qty})`).join(", ")}
            </p>
            {r.prescriptionVerification &&
            r.prescriptionVerification.status === "approved" ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <BadgeCheck className="size-3" /> Digitally Signed
              </span>
            ) : r.status === "verifying" ? (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold animate-pulse">
                Needs Pharmacist Verification
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "payment",
        header: "Payment",
        render: (r) => (
          <div>
            <p className="font-mono text-xs font-bold text-ink">
              {formatMoney(r.total)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
              {r.payment?.method || "UPI"} · {r.payment?.status || "paid"}
            </p>
          </div>
        ),
      },
      {
        key: "placedAt",
        header: "Placed",
        sortValue: (r) => r.placedAt,
        render: (r) => (
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(r.placedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Action",
        render: (r) => (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs font-bold rounded-lg"
            onClick={() => setViewing(r)}
          >
            Fulfill & Manage
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Live Order Dispensing Queue"
        description="Review incoming patient orders, verify electronic prescriptions with R. Ph. state digital signatures, and dispatch couriers with real-time GPS synchronization."
      />

      <WorkspaceSection
        title="Live Dispensing & Fulfillment"
        description="Connected to Medora Real-Time Order Service. Status transitions update the patient tracking app instantly."
      >
        <DataTable<Order>
          columns={columns}
          rows={orders}
          getId={(r) => r.id}
          searchText={(r) =>
            `${r.id} ${r.pharmacyName} ${r.items.map((i) => i.name).join(" ")}`
          }
          searchPlaceholder="Search order ID, patient, drug..."
        />
      </WorkspaceSection>

      {/* Main Order Details & Dispensing Modal */}
      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        {viewing && (
          <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                    <Package className="size-4" />
                  </span>
                  <div>
                    <DialogTitle className="font-display text-lg font-extrabold text-ink">
                      Order {viewing.id} Dispensing Console
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {viewing.fulfilment === "delivery"
                        ? "⚡ Delivery Order"
                        : "🏪 Counter Reservation"}{" "}
                      · Placed {new Date(viewing.placedAt).toLocaleString()}
                    </DialogDescription>
                  </div>
                </div>
                <StatusPill tone={statusTone[viewing.status].tone}>
                  {statusTone[viewing.status].label}
                </StatusPill>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Prescription Action Banner */}
              {viewing.status === "verifying" && (
                <div className="rounded-2xl border-2 border-blue-500/40 bg-blue-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <ShieldCheck className="size-4" /> Prescription
                      Verification Pending
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Scheduled Rx item attached. Licensed pharmacist signature
                      required prior to dispensing.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="font-bold text-xs shrink-0"
                    onClick={() => setRxModalOpen(true)}
                  >
                    <FileCheck2 className="size-3.5 mr-1" /> Review & Digitally
                    Sign
                  </Button>
                </div>
              )}

              {/* Verified Prescription Details */}
              {viewing.prescriptionVerification &&
                viewing.prescriptionVerification.status === "approved" && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center gap-1">
                        <BadgeCheck className="size-4 text-emerald-600 dark:text-emerald-400" />{" "}
                        Digitally Endorsed by Pharmacist
                      </span>
                      <span className="font-mono">
                        {viewing.prescriptionVerification.digitalSignature}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Signatory:{" "}
                      <span className="font-semibold text-foreground">
                        {viewing.prescriptionVerification.verifiedByPharmacist}
                      </span>{" "}
                      ({viewing.prescriptionVerification.pharmacistLicence})
                    </p>
                  </div>
                )}

              {/* Order Items Table */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Medications to Dispense
                </h4>
                <div className="divide-y divide-border/50">
                  {viewing.items.map((it) => (
                    <div
                      key={it.medicineId}
                      className="flex justify-between py-2 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {it.name}
                        </p>
                        <p className="text-muted-foreground">
                          {it.prescriptionOnly
                            ? "Prescription Drug (Schedule H)"
                            : "OTC Generic"}{" "}
                          · Qty: {it.qty}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-foreground">
                        {formatMoney(it.price * it.qty)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-sm font-extrabold text-foreground">
                  <span>
                    Total Amount Paid ({viewing.payment?.method.toUpperCase()})
                  </span>
                  <span>{formatMoney(viewing.total)}</span>
                </div>
              </div>

              {/* Delivery Details */}
              {viewing.delivery && (
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Truck className="size-3.5 text-primary" /> Delivery
                      Partner: {viewing.delivery.partner}
                    </span>
                    <span className="font-mono">
                      {viewing.delivery.trackingNumber}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Rider:{" "}
                    <span className="font-semibold text-foreground">
                      {viewing.delivery.riderName}
                    </span>{" "}
                    ({viewing.delivery.riderPhone}) ·{" "}
                    {viewing.delivery.vehicleNumber}
                  </p>
                  <p className="text-muted-foreground truncate">
                    Destination: {viewing.delivery.deliveryAddress}
                  </p>
                </div>
              )}

              {/* Action Buttons for Dispensing */}
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
                {viewing.status === "accepted" && (
                  <Button
                    size="sm"
                    className="font-bold text-xs"
                    onClick={() =>
                      handleAdvanceStatus(
                        "preparing",
                        "Medicines picked and packed in tamper-proof seal.",
                      )
                    }
                  >
                    <Package className="size-3.5 mr-1" /> Start Packing
                  </Button>
                )}

                {viewing.status === "preparing" &&
                  viewing.fulfilment === "delivery" && (
                    <Button
                      size="sm"
                      className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setDispatchModalOpen(true)}
                    >
                      <Truck className="size-3.5 mr-1" /> Dispatch to Courier
                      (Dunzo/Shadowfax)
                    </Button>
                  )}

                {viewing.status === "preparing" &&
                  viewing.fulfilment === "pickup" && (
                    <Button
                      size="sm"
                      className="font-bold text-xs"
                      onClick={() =>
                        handleAdvanceStatus(
                          "ready",
                          "Packed and placed in Counter Pickup shelf.",
                        )
                      }
                    >
                      <BadgeCheck className="size-3.5 mr-1" /> Mark Ready for
                      Pickup
                    </Button>
                  )}

                {(viewing.status === "ready" ||
                  viewing.status === "out_for_delivery") && (
                  <Button
                    size="sm"
                    className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() =>
                      handleAdvanceStatus(
                        "completed",
                        "Handover completed successfully. Patient received package.",
                      )
                    }
                  >
                    <CheckCircle2 className="size-3.5 mr-1" /> Mark Order
                    Completed
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Pharmacist Verification Modal */}
      <Dialog open={rxModalOpen} onOpenChange={setRxModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-extrabold text-ink flex items-center gap-2">
              <FileCheck2 className="size-5 text-primary" /> Pharmacist Digital
              Signature Endorsement
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sign off on Schedule H prescription dispensation per CDSCO
              Pharmacy Practice Regulations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pharmacist Name
              </Label>
              <Input
                value={pharmacistName}
                onChange={(e) => setPharmacistName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                State Pharmacy Registration No.
              </Label>
              <Input
                value={licenceNo}
                onChange={(e) => setLicenceNo(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Verification Notes
              </Label>
              <Textarea
                value={rxNotes}
                onChange={(e) => setRxNotes(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRxModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleVerifyPrescription}
                className="font-bold"
              >
                <ShieldCheck className="size-3.5 mr-1" /> Endorse & Digitally
                Sign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Courier Dispatch Modal */}
      <Dialog open={dispatchModalOpen} onOpenChange={setDispatchModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-extrabold text-ink flex items-center gap-2">
              <Truck className="size-5 text-primary" /> Dispatch to Delivery
              Partner
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign order to courier with live GPS telemetry integration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Delivery Partner
              </Label>
              <Select value={courierPartner} onValueChange={setCourierPartner}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dunzo MedExpress">
                    Dunzo MedExpress (30 min SLA)
                  </SelectItem>
                  <SelectItem value="Shadowfax Health Logistics">
                    Shadowfax Health Logistics
                  </SelectItem>
                  <SelectItem value="Porter Clinical">
                    Porter Clinical Express
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Rider Name
                </Label>
                <Input
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Vehicle Number
                </Label>
                <Input
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rider Contact
              </Label>
              <Input
                value={riderPhone}
                onChange={(e) => setRiderPhone(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDispatchModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDispatchCourier}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Navigation className="size-3.5 mr-1" /> Dispatch & Start GPS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
