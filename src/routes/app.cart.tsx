import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  EmptyState,
  PageHeader,
  SafetyNotice,
} from "@/components/common/primitives";
import { demoPharmacies } from "@/data/demo-catalog";
import { formatMoney } from "@/services/medicines";
import { useStore } from "@/lib/store";
import { orderService } from "@/services/order-service";
import { PaymentGatewayModal } from "@/components/checkout/PaymentGatewayModal";

export const Route = createFileRoute("/app/cart")({
  head: () => ({
    meta: [
      { title: "Basket & Real Checkout — Medora" },
      {
        name: "description",
        content:
          "Review items, attach prescriptions, authorize payment through secure gateway, and initiate real-time delivery tracking.",
      },
      { property: "og:title", content: "Basket & Real Checkout — Medora" },
      {
        property: "og:description",
        content:
          "Complete pharmacy orders with live fulfillment and instant digital payment.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { state, setCartQty, removeFromCart, pushNotification } = useStore();
  const navigate = useNavigate();
  const [pharmacyId, setPharmacyId] = useState(demoPharmacies[0]?.id ?? "");
  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">(
    "delivery",
  );
  const [prescriptionId, setPrescriptionId] = useState<string>("none");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const rawTotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = fulfilment === "delivery" ? 35.0 : 0;
  const finalTotal = rawTotal + deliveryFee;

  const needsRx = state.cart.some((i) => i.prescriptionOnly);
  const verifiedRx = state.prescriptions.filter(
    (r) => r.status === "verified" || r.status === "reviewed",
  );
  const rxSelected = prescriptionId !== "none";
  const blocked = needsRx && !rxSelected;

  const pharmacy =
    demoPharmacies.find((p) => p.id === pharmacyId) || demoPharmacies[0]!;

  const handleCheckoutClick = () => {
    if (blocked) {
      toast.error("Prescription Required", {
        description:
          "One or more items in your cart require a valid prescription. Please select an uploaded prescription or upload a new one.",
      });
      return;
    }
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = ({
    method,
    transactionId,
  }: {
    method: "upi" | "card" | "netbanking" | "cod";
    transactionId: string;
  }) => {
    const order = orderService.createOrder({
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      items: state.cart.map((i) => ({
        medicineId: i.medicineId,
        name: i.name,
        qty: i.qty,
        price: i.price,
        prescriptionOnly: i.prescriptionOnly,
      })),
      fulfilment,
      prescriptionId: rxSelected ? prescriptionId : undefined,
      paymentMethod: method,
      deliveryAddress:
        "Flat 402, Sea Breeze Apartments, Hill Road, Bandra West, Mumbai 400050",
    });

    // Clear cart
    state.cart.forEach((i) => removeFromCart(i.medicineId));

    pushNotification({
      kind: "order",
      title: `Order ${order.id} Placed & Confirmed`,
      body: `${pharmacy.name} · Paid via ${method.toUpperCase()} (${transactionId}). Live fulfillment initiated.`,
    });

    toast.success(`Order ${order.id} Placed Successfully!`, {
      description: `Live tracking is now active. Dispatched from ${pharmacy.name}.`,
    });

    void navigate({ to: "/app/orders" });
  };

  return (
    <div className="space-y-8">
      <PaymentGatewayModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        total={finalTotal}
        pharmacyName={pharmacy.name}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <PageHeader
        title="Basket & Secure Checkout"
        description="Verify prescription requirements, choose delivery or collection, and authorize instant payment via RBI-compliant gateway."
      />

      {state.cart.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your basket is empty"
          description="Add medicines from comparison or search to place an order with instant pharmacy fulfillment."
          action={
            <Button asChild>
              <Link to="/app/search">Explore medicines</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="space-y-4">
            {state.cart.map((item) => (
              <article
                key={item.medicineId}
                className="surface flex flex-wrap items-center gap-4 p-5 rounded-2xl border border-border/80 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to="/app/medicine/$medicineId"
                    params={{ medicineId: item.medicineId }}
                    className="font-display font-bold text-base text-ink hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.prescriptionOnly ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        ⚠️ Prescription Required
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Over the counter
                      </span>
                    )}{" "}
                    · {formatMoney(item.price)} per pack
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8 rounded-lg"
                    onClick={() => setCartQty(item.medicineId, item.qty - 1)}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="font-mono text-sm font-bold w-6 text-center">
                    {item.qty}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8 rounded-lg"
                    onClick={() => setCartQty(item.medicineId, item.qty + 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:bg-destructive/10 rounded-lg ml-2"
                    onClick={() => removeFromCart(item.medicineId)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </article>
            ))}

            {needsRx && (
              <SafetyNotice title="Prescription Gating Active" tone="info">
                Your basket contains scheduled medications. Medora enforces
                CDSCO regulations: an approved digital or scanned prescription
                must be attached before dispatch.
              </SafetyNotice>
            )}
          </section>

          <aside className="space-y-4">
            <div className="surface space-y-4 p-5 sm:p-6 rounded-3xl border-2 border-primary/20 shadow-sm">
              <h3 className="font-display text-base font-extrabold text-ink">
                Fulfillment & Summary
              </h3>

              <div className="space-y-1.5">
                <Label
                  htmlFor="pharmacy"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Dispensing Pharmacy
                </Label>
                <Select value={pharmacyId} onValueChange={setPharmacyId}>
                  <SelectTrigger id="pharmacy" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {demoPharmacies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.distanceKm} km)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="fulfilment"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Fulfillment Mode
                </Label>
                <Select
                  value={fulfilment}
                  onValueChange={(v) =>
                    setFulfilment(v as "pickup" | "delivery")
                  }
                >
                  <SelectTrigger id="fulfilment" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="delivery">
                      ⚡ Dunzo / Shadowfax Delivery (~30 mins · ₹35)
                    </SelectItem>
                    <SelectItem value="pickup">
                      🏪 Counter Pickup (Free · Ready in 15 mins)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="rx"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Attach Prescription
                </Label>
                <Select
                  value={prescriptionId}
                  onValueChange={setPrescriptionId}
                >
                  <SelectTrigger id="rx" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">
                      {needsRx
                        ? "⚠️ Select a verified prescription"
                        : "No prescription required"}
                    </SelectItem>
                    {verifiedRx.map((rx) => (
                      <SelectItem key={rx.id} value={rx.id}>
                        {rx.fileName} · Verified
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {needsRx && (
                  <p className="text-[11px] text-muted-foreground">
                    Need to upload?{" "}
                    <Link
                      to="/app/prescriptions"
                      className="text-primary font-bold underline"
                    >
                      Upload Prescription
                    </Link>
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items Subtotal</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatMoney(rawTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery & Packing</span>
                  <span className="font-mono font-bold text-foreground">
                    {fulfilment === "delivery"
                      ? formatMoney(deliveryFee)
                      : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated GST (12%)</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatMoney(rawTotal * 0.12)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold text-foreground">
                  <span>Total Amount</span>
                  <span className="font-display font-black text-ink">
                    {formatMoney(finalTotal)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full font-bold h-11 rounded-xl shadow-sm text-sm"
                onClick={handleCheckoutClick}
              >
                <Lock className="mr-1.5 size-4" /> Proceed to Secure Payment
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>256-Bit Encrypted & RBI Verified</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
