import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  Clock,
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
  Package,
  Settings2,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/common/primitives";
import type { NotificationItem } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { notificationService } from "@/services/notification-service";
import { NotificationPreferencesModal } from "@/components/notifications/NotificationPreferencesModal";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "Real-Time Notifications & Multi-Channel Center — Medora" },
      {
        name: "description",
        content:
          "Multi-channel notifications for medicine dose reminders, live Dunzo order GPS updates, price drop alerts, and CDSCO safety advisories.",
      },
      { property: "og:title", content: "Real-Time Notifications — Medora" },
      {
        property: "og:description",
        content: "Multi-channel alerts across Web Push, SMS, Email and In-App.",
      },
    ],
  }),
  component: NotificationsPage,
});

const kindMeta: Record<
  NotificationItem["kind"],
  { label: string; icon: any; tone: string; badgeCls: string }
> = {
  order: {
    label: "Order & Delivery",
    icon: Truck,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    badgeCls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  reminder: {
    label: "Dose Reminder",
    icon: Clock,
    tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    badgeCls: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  price: {
    label: "Price Drop Alert",
    icon: Tag,
    tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    badgeCls: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  },
  safety: {
    label: "Safety Advisory",
    icon: ShieldAlert,
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    badgeCls: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
  pharmacy: {
    label: "Pharmacy Console",
    icon: Package,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    badgeCls: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  system: {
    label: "System Broadcast",
    icon: Bell,
    tone: "bg-muted text-muted-foreground border-border",
    badgeCls: "bg-muted text-muted-foreground",
  },
};

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);

  useEffect(() => {
    const unsub = notificationService.subscribe((updated) => {
      setItems([...updated]);
    });
    return unsub;
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const filteredItems = items.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.kind === filter;
  });

  const handleToggleRead = (id: string, read: boolean) => {
    notificationService.markAsRead(id, !read);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
    toast.success("Notification dismissed");
  };

  return (
    <div className="space-y-6">
      <NotificationPreferencesModal
        open={prefsModalOpen}
        onOpenChange={setPrefsModalOpen}
      />

      <PageHeader
        title="Notifications & Multi-Channel Center"
        description="Unified dispatch hub for real-time dose reminders, Dunzo delivery telemetry, price drop alerts, and CDSCO safety advisories."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrefsModalOpen(true)}
              className="rounded-xl font-bold text-xs gap-1.5 h-8"
            >
              <Settings2 className="size-3.5 text-primary" /> Channel
              Preferences
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="rounded-xl font-bold text-xs gap-1.5 h-8"
              >
                <CheckCheck className="size-3.5 text-emerald-600" /> Mark all
                read
              </Button>
            )}
          </div>
        }
      />

      {/* Multi-Channel Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-border/80 bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span>Live Multi-Channel Gateways:</span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <BellRing className="size-3.5 text-primary" />
            <span>Web Push</span>
          </div>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Mail className="size-3.5 text-blue-500" />
            <span>Email</span>
          </div>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Smartphone className="size-3.5 text-emerald-500" />
            <span>SMS Alerts</span>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-muted-foreground">
          {unreadCount} unread · {items.length} total
        </span>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="space-y-4">
        <TabsList className="rounded-2xl p-1 bg-muted/50 border border-border/60 flex-wrap h-auto">
          <TabsTrigger value="all" className="rounded-xl text-xs font-bold">
            All ({items.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-xl text-xs font-bold">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger
            value="reminder"
            className="rounded-xl text-xs font-bold"
          >
            💊 Dose Reminders
          </TabsTrigger>
          <TabsTrigger value="order" className="rounded-xl text-xs font-bold">
            ⚡ Orders & Delivery
          </TabsTrigger>
          <TabsTrigger value="price" className="rounded-xl text-xs font-bold">
            🏷️ Price Drops
          </TabsTrigger>
          <TabsTrigger value="safety" className="rounded-xl text-xs font-bold">
            ⚠️ Safety Advisories
          </TabsTrigger>
          <TabsTrigger
            value="pharmacy"
            className="rounded-xl text-xs font-bold"
          >
            🏪 Pharmacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-3">
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title="No notifications in this view"
              description="New alerts from medicine dose reminders, price drops, or order fulfillment will appear here."
            />
          ) : (
            <div className="space-y-3">
              {filteredItems.map((n) => {
                const meta = kindMeta[n.kind] || kindMeta.system;
                const IconComponent = meta.icon;

                return (
                  <article
                    key={n.id}
                    className={cn(
                      "surface flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 sm:p-5 rounded-2xl border-2 transition shadow-xs",
                      !n.read
                        ? "border-primary/40 bg-gradient-to-r from-primary/5 via-card to-background"
                        : "border-border/70 hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          "grid size-10 place-items-center rounded-xl border shrink-0 mt-0.5",
                          meta.tone,
                        )}
                      >
                        <IconComponent className="size-5" />
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={cn(
                              "font-display text-sm font-extrabold text-ink",
                              !n.read && "text-primary",
                            )}
                          >
                            {n.title}
                          </h4>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              meta.badgeCls,
                            )}
                          >
                            {meta.label}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {n.body}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                          <span className="font-mono">
                            {new Date(n.at).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>

                          {/* Channels badges */}
                          {n.channels && n.channels.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              {n.channels.map((ch) => (
                                <span
                                  key={ch}
                                  className="rounded bg-muted/70 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase"
                                >
                                  {ch.replace("_", "-")}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {n.actionUrl && (
                        <Button
                          size="sm"
                          asChild
                          className="rounded-xl text-xs font-bold h-8 px-3 shadow-xs"
                        >
                          <Link to={n.actionUrl as any}>
                            {n.actionLabel || "View"}
                            <ArrowRight className="ml-1 size-3" />
                          </Link>
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                        title={n.read ? "Mark as unread" : "Mark as read"}
                        onClick={() => handleToggleRead(n.id, n.read)}
                      >
                        {n.read ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
                        title="Dismiss"
                        onClick={() => handleDelete(n.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
