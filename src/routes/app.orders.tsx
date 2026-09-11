import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock,
  Download,
  FileCheck2,
  MapPin,
  Navigation,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order, OrderStatus } from "@/lib/domain";
import { formatMoney } from "@/services/medicines";
import { orderService } from "@/services/order-service";
import { LiveOrderTrackingModal } from "@/components/orders/LiveOrderTrackingModal";

export const Route = createFileRoute("/app/orders")({
  head: () => ({
    meta: [
      { title: "Orders & Live Fulfillment — Medora" },
      {
        name: "description",
        content:
          "Track real-time pharmacy orders, live Dunzo/Shadowfax delivery GPS, pharmacist prescription signatures, and digital tax invoices.",
      },
      { property: "og:title", content: "Orders & Live Fulfillment — Medora" },
      {
        property: "og:description",
        content:
          "Real-time prescription verification, payment tracking, and live courier map.",
      },
    ],
  }),
  component: OrdersPage,
});

const statusMeta: Record<OrderStatus, { label: string; cls: string }> = {
  awaiting_prescription: {
    label: "Awaiting Prescription",
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold",
  },
  verifying: {
    label: "Pharmacist Verifying",
    cls: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold animate-pulse",
  },
  accepted: {
    label: "Order Accepted",
    cls: "border-primary/40 bg-primary/10 text-primary font-bold",
  },
  preparing: {
    label: "Pharmacy Packing",
    cls: "border-primary/40 bg-primary/10 text-primary font-bold",
  },
  ready: {
    label: "Ready for Pickup",
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold",
  },
  out_for_delivery: {
    label: "⚡ Out for Delivery",
    cls: "border-emerald-500/60 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold animate-pulse",
  },
  completed: {
    label: "Completed",
    cls: "border-border bg-secondary text-muted-foreground font-semibold",
  },
  cancelled: {
    label: "Cancelled & Refunded",
    cls: "border-destructive/30 bg-destructive/10 text-destructive font-semibold",
  },
};

function OrderCard({
  order,
  onTrack,
}: {
  order: Order;
  onTrack: (order: Order) => void;
}) {
  const meta = statusMeta[order.status];
  const isDelivery = order.fulfilment === "delivery";

  return (
    <article className="surface p-5 sm:p-6 rounded-3xl border-2 border-border/70 hover:border-primary/40 transition shadow-xs space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-base font-extrabold text-ink">
              {order.pharmacyName}
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono font-bold text-muted-foreground">
              {order.id}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(order.placedAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            ·{" "}
            <span className="font-semibold text-foreground">
              {isDelivery ? "⚡ Dunzo / Shadowfax Express" : "🏪 Store Pickup"}
            </span>
          </p>
        </div>
        <Badge
          variant="outline"
          className={`rounded-full px-3 py-1 text-xs ${meta.cls}`}
        >
          {meta.label}
        </Badge>
      </header>

      {/* Live Driver & Pharmacist Status Strip */}
      {isDelivery && order.status === "out_for_delivery" && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Navigation className="size-4 text-emerald-600 animate-pulse" />
            <span className="font-semibold text-foreground">
              Rider {order.delivery?.riderName || "Aakash Mehta"} is{" "}
              {order.delivery?.distanceKm || 1.2} km away
            </span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            ETA ~{order.delivery?.estimatedMinutes || 10} mins
          </span>
        </div>
      )}

      {/* Items Preview */}
      <div className="divide-y divide-border/40 text-xs">
        {order.items.map((i) => (
          <div
            key={i.medicineId}
            className="flex items-center justify-between py-1.5 text-muted-foreground"
          >
            <span className="font-medium text-foreground">
              {i.name} <span className="text-muted-foreground">× {i.qty}</span>
            </span>
            <span className="font-mono">{formatMoney(i.price * i.qty)}</span>
          </div>
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-display text-base font-extrabold text-ink">
            {formatMoney(order.total)}
          </span>
          {order.payment && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
              {order.payment.method} · {order.payment.status}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onTrack(order)}
            className="rounded-xl font-bold text-xs h-8 px-3.5 shadow-xs"
          >
            <Navigation className="size-3 mr-1.5" /> Live Track & Details
          </Button>
        </div>
      </footer>
    </article>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);

  useEffect(() => {
    const unsub = orderService.subscribe((updated) => {
      setOrders([...updated]);
      if (selectedOrder) {
        const fresh = updated.find((o) => o.id === selectedOrder.id);
        if (fresh) setSelectedOrder(fresh);
      }
    });
    return unsub;
  }, [selectedOrder?.id]);

  const activeOrders = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled",
  );
  const completedOrders = orders.filter((o) => o.status === "completed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const handleOpenTrack = (order: Order) => {
    setSelectedOrder(order);
    setTrackingOpen(true);
  };

  return (
    <div className="space-y-8">
      <LiveOrderTrackingModal
        order={selectedOrder}
        open={trackingOpen}
        onOpenChange={setTrackingOpen}
        onOrderUpdated={(updated) => setSelectedOrder(updated)}
      />

      <PageHeader
        title="Orders & Live Fulfillment"
        description="Monitor real-time pharmacy processing, pharmacist prescription endorsements, and live GPS courier dispatch."
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Place an order from the medicine catalogue or basket to experience real-time pharmacy fulfillment."
          action={
            <Button asChild>
              <Link to="/app/search">Browse medicines</Link>
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="rounded-2xl p-1 bg-muted/50 border border-border/60">
            <TabsTrigger value="all" className="rounded-xl text-xs font-bold">
              All Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="rounded-xl text-xs font-bold"
            >
              ⚡ In-Transit & Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-xl text-xs font-bold"
            >
              ✓ Completed ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="rounded-xl text-xs font-bold"
            >
              Cancelled ({cancelledOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} onTrack={handleOpenTrack} />
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No active orders right now.
              </p>
            ) : (
              activeOrders.map((o) => (
                <OrderCard key={o.id} order={o} onTrack={handleOpenTrack} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No completed orders yet.
              </p>
            ) : (
              completedOrders.map((o) => (
                <OrderCard key={o.id} order={o} onTrack={handleOpenTrack} />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No cancelled orders.
              </p>
            ) : (
              cancelledOrders.map((o) => (
                <OrderCard key={o.id} order={o} onTrack={handleOpenTrack} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
