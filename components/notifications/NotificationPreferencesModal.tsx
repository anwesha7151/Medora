import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  History,
  Mail,
  MessageSquare,
  Play,
  Send,
  Settings2,
  ShieldAlert,
  Smartphone,
  Tag,
  Volume2,
  VolumeX,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type DeliveryLogEntry,
  type NotificationPreferences,
  notificationService,
} from "@/services/notification-service";

interface NotificationPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPreferencesModal({
  open,
  onOpenChange,
}: NotificationPreferencesModalProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    notificationService.getPreferences(),
  );
  const [logs, setLogs] = useState<DeliveryLogEntry[]>(
    notificationService.getDeliveryLogs(),
  );
  const [pushStatus, setPushStatus] = useState<string>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(Notification.permission);
    }
    setPrefs(notificationService.getPreferences());
    setLogs(notificationService.getDeliveryLogs());
  }, [open]);

  const handleSave = () => {
    notificationService.savePreferences(prefs);
    toast.success("Notification preferences saved successfully");
    onOpenChange(false);
  };

  const handleRequestPush = async () => {
    const permission = await notificationService.requestBrowserPushPermission();
    setPushStatus(permission);
    setPrefs(notificationService.getPreferences());
    if (permission === "granted") {
      toast.success("Browser Push Notifications enabled!");
      notificationService.dispatch({
        title: "🔔 Push Notifications Active",
        body: "You will receive immediate alerts for orders, dose reminders, and safety warnings.",
        kind: "system",
        channels: ["push", "in_app"],
      });
      setLogs(notificationService.getDeliveryLogs());
    } else {
      toast.error("Push permission denied or dismissed.");
    }
  };

  const handleTestEmail = () => {
    notificationService.dispatch({
      title: "📧 Medora Verified Email Gateway Test",
      body: `Transactional test email dispatched to ${prefs.emailAddress}. Order receipts and price alerts will arrive here.`,
      kind: "system",
      channels: ["email", "in_app"],
    });
    setLogs(notificationService.getDeliveryLogs());
    toast.success(`Test email sent to ${prefs.emailAddress}`);
  };

  const handleTestSms = () => {
    notificationService.dispatch({
      title: "📱 SMS Gateway Delivery Test",
      body: `[MEDORA] Delivery tracking test SMS delivered to ${prefs.phoneNumber}. DLR: DELIVRD.`,
      kind: "system",
      channels: ["sms", "in_app"],
    });
    setLogs(notificationService.getDeliveryLogs());
    toast.success(`Test SMS delivered to ${prefs.phoneNumber}`);
  };

  const handleTestDose = () => {
    notificationService.notifyDoseReminder(
      {
        id: "rem-demo-01",
        medicineName: "Panacet",
        strength: "500mg",
        times: ["14:00"],
        startDate: "2026-08-20",
        endDate: "2026-08-27",
        instruction: "Take 1 tablet after lunch with water",
        active: true,
        log: [],
      },
      "2:00 PM",
    );
    setLogs(notificationService.getDeliveryLogs());
    toast.info("Dose reminder notification triggered!");
  };

  const handleTestPriceDrop = () => {
    notificationService.notifyPriceAlert(
      "Glycomet 500mg SR",
      18,
      42.0,
      "Wellness Forever Juhu",
    );
    setLogs(notificationService.getDeliveryLogs());
    toast.info("Price alert notification triggered!");
  };

  const handleTestSafety = () => {
    notificationService.notifySafetyAlert(
      "CDSCO Black-Box Warning Update",
      "New guidance issued regarding combined NSAID usage with ACE inhibitors in hypertension patients.",
      "warning",
    );
    setLogs(notificationService.getDeliveryLogs());
    toast.warning("Clinical safety alert triggered!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Settings2 className="size-4" />
            </span>
            <div>
              <DialogTitle className="font-display text-lg font-extrabold text-ink">
                Multi-Channel Notification Center
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure real Web Push, Transactional Email, SMS Carrier
                gateways, and sound chimes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="channels" className="space-y-4 py-2">
          <TabsList className="rounded-2xl p-1 bg-muted/50 border border-border/60">
            <TabsTrigger
              value="channels"
              className="rounded-xl text-xs font-bold"
            >
              Dispatch Channels
            </TabsTrigger>
            <TabsTrigger value="test" className="rounded-xl text-xs font-bold">
              Test Triggers
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-xl text-xs font-bold">
              Delivery Audit Logs ({logs.length})
            </TabsTrigger>
          </TabsList>

          {/* Channels Configuration Tab */}
          <TabsContent value="channels" className="space-y-5">
            {/* Browser Web Push Card */}
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
                    <BellRing className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-sm font-bold text-ink">
                        HTML5 Browser Web Push
                      </h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          pushStatus === "granted"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {pushStatus === "granted"
                          ? "Active · Granted"
                          : pushStatus}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Receive instant desktop & lock-screen popups for order
                      deliveries and dose times.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleRequestPush}
                  className="font-bold text-xs shrink-0 rounded-xl"
                >
                  {pushStatus === "granted"
                    ? "Re-Authorize Push"
                    : "Enable Push Notifications"}
                </Button>
              </div>
            </div>

            {/* Email & SMS Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email Gateway */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Email Delivery
                    </span>
                  </div>
                  <Switch
                    checked={prefs.emailEnabled}
                    onCheckedChange={(checked) =>
                      setPrefs({ ...prefs, emailEnabled: checked })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Recipient Email Address
                  </Label>
                  <Input
                    value={prefs.emailAddress}
                    onChange={(e) =>
                      setPrefs({ ...prefs, emailAddress: e.target.value })
                    }
                    placeholder="patient@medora.health"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* SMS Gateway */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      SMS Carrier Alerts
                    </span>
                  </div>
                  <Switch
                    checked={prefs.smsEnabled}
                    onCheckedChange={(checked) =>
                      setPrefs({ ...prefs, smsEnabled: checked })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Mobile Phone Number
                  </Label>
                  <Input
                    value={prefs.phoneNumber}
                    onChange={(e) =>
                      setPrefs({ ...prefs, phoneNumber: e.target.value })
                    }
                    placeholder="+91 98201 44829"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Sound Effects & Categories */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  {prefs.soundEnabled ? (
                    <Volume2 className="size-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="size-4 text-muted-foreground" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      Audio Chime Synthesis
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Synthesizes Web Audio tone on arrival
                    </p>
                  </div>
                </div>
                <Switch
                  checked={prefs.soundEnabled}
                  onCheckedChange={(checked) =>
                    setPrefs({ ...prefs, soundEnabled: checked })
                  }
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { key: "orders", label: "Orders & Delivery" },
                  { key: "reminders", label: "Dose Reminders" },
                  { key: "prices", label: "Price Drops" },
                  { key: "safety", label: "Safety Advisories" },
                  { key: "pharmacy", label: "Pharmacy Alerts" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2 text-xs"
                  >
                    <span className="font-medium text-foreground">{label}</span>
                    <Switch
                      checked={(prefs.categories as any)[key]}
                      onCheckedChange={(checked) =>
                        setPrefs({
                          ...prefs,
                          categories: { ...prefs.categories, [key]: checked },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="font-bold">
                Save Preferences
              </Button>
            </div>
          </TabsContent>

          {/* Test Triggers Tab */}
          <TabsContent value="test" className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Trigger simulated multi-channel notifications to test real-time
              browser popups, transactional email logs, and SMS receipts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Transactional Email Test
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sends an order receipt confirmation email to{" "}
                  {prefs.emailAddress}.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestEmail}
                  className="w-full text-xs font-bold gap-1.5 mt-1"
                >
                  <Send className="size-3" /> Test Email Gateway
                </Button>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    SMS Carrier Test
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dispatches live delivery dispatch SMS to {prefs.phoneNumber}.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestSms}
                  className="w-full text-xs font-bold gap-1.5 mt-1"
                >
                  <MessageSquare className="size-3" /> Test SMS Delivery
                </Button>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Medicine Dose Reminder
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fires an interactive dose notification with 1-click adherence
                  logging.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestDose}
                  className="w-full text-xs font-bold gap-1.5 mt-1"
                >
                  <Play className="size-3" /> Trigger Dose Reminder
                </Button>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Price Drop Notification
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Simulates a 18% price drop alert on Glycomet 500mg SR at
                  nearby pharmacies.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestPriceDrop}
                  className="w-full text-xs font-bold gap-1.5 mt-1"
                >
                  <Tag className="size-3" /> Trigger Price Drop Alert
                </Button>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    CDSCO Clinical Safety Advisory
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Broadcasts high-priority drug interaction and black-box safety
                  notification.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestSafety}
                  className="w-full text-xs font-bold gap-1.5 mt-1 text-rose-600 hover:bg-rose-500/10"
                >
                  <ShieldAlert className="size-3" /> Trigger Safety Alert
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Delivery Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Real-time audit log of all multi-channel dispatches (In-App, HTML5
              Push, SMTP Email, Fast2SMS / Twilio).
            </p>

            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No delivery logs recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-border/50 max-h-[340px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            log.channel === "push"
                              ? "bg-primary/10 text-primary"
                              : log.channel === "email"
                                ? "bg-blue-500/10 text-blue-600"
                                : log.channel === "sms"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {log.channel}
                        </span>
                        <span className="font-semibold text-foreground truncate max-w-[220px]">
                          {log.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="truncate">{log.detail}</span>
                      <span
                        className={`text-[10px] font-bold uppercase shrink-0 ${
                          log.status === "delivered"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : log.status === "failed"
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
