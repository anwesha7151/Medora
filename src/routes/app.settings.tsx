import { createFileRoute } from "@tanstack/react-router";
import {
  KeyRound,
  Loader2,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, SafetyNotice } from "@/components/common/primitives";
import { demoAuditEvents } from "@/data/demo-catalog";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Profile & settings — Medora" },
      {
        name: "description",
        content:
          "Manage your health profile, allergies, privacy consent, security controls and account activity.",
      },
      { property: "og:title", content: "Profile & settings — Medora" },
      {
        property: "og:description",
        content: "Health profile, privacy consent and security controls.",
      },
    ],
  }),
  component: SettingsPage,
});

const ageBands = [
  "Under 18",
  "18–29",
  "30–39",
  "40–49",
  "50–59",
  "60–69",
  "70+",
];

function SettingsPage() {
  const { state, update, resetDemo } = useStore();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState(state.profile);
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    window.setTimeout(() => {
      update({ profile });
      setSaving(false);
      toast.success("Profile updated", {
        description: "Stored locally on this device in demo mode.",
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & settings"
        description="Your health profile shapes safety checks across Medora. Keep allergies and current medicines accurate."
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Health profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & consent</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-6 space-y-6">
          <section className="surface p-6">
            <h3 className="text-base font-semibold text-ink">
              Theme & display preferences
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose your preferred interface theme. Medora is styled with warm
              clinical paper tones in light mode and deep high-contrast tones in
              dark mode.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary-soft/40 shadow-sm"
                    : "border-border bg-card hover:border-border-strong"
                }`}
              >
                <div className="grid size-9 place-items-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  <Sun className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink">Light mode</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Warm clinical paper background with deep navy ink
                    typography.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary-soft/40 shadow-sm"
                    : "border-border bg-card hover:border-border-strong"
                }`}
              >
                <div className="grid size-9 place-items-center rounded-md bg-slate-800 text-teal-400">
                  <Moon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink">Dark mode</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Eye-safe contrast palette designed for night use and
                    low-light clinical reading.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                  theme === "system"
                    ? "border-primary bg-primary-soft/40 shadow-sm"
                    : "border-border bg-card hover:border-border-strong"
                }`}
              >
                <div className="grid size-9 place-items-center rounded-md bg-secondary text-foreground">
                  <Palette className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink">System theme</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Automatically synchronize with your operating system or
                    browser settings.
                  </p>
                </div>
              </button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <section className="surface grid gap-5 p-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={profile.fullName}
                maxLength={100}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                maxLength={255}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">Age band</Label>
              <Select
                value={profile.ageBand}
                onValueChange={(v) => setProfile({ ...profile, ageBand: v })}
              >
                <SelectTrigger id="age">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ageBands.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.city}
                maxLength={80}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="allergies">Allergies (one per line)</Label>
              <Textarea
                id="allergies"
                rows={3}
                value={profile.allergies.join("\n")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    allergies: e.target.value.split("\n").filter(Boolean),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Recorded as self-reported. Always tell a pharmacist directly
                before anything is dispensed — Medora never substitutes for that
                conversation.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="meds">Current medicines (one per line)</Label>
              <Textarea
                id="meds"
                rows={3}
                value={profile.currentMedicines.join("\n")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    currentMedicines: e.target.value
                      .split("\n")
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={save} disabled={saving}>
                {saving && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}{" "}
                Save profile
              </Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6 space-y-4">
          <section className="surface divide-y divide-border">
            {[
              {
                key: "consentInformationalUse" as const,
                title: "I understand Medora is informational",
                body: "Medora does not diagnose, prescribe, or replace a pharmacist or doctor.",
              },
              {
                key: "consentDataProcessing" as const,
                title: "Process my health data to run safety checks",
                body: "Allergies and current medicines are used for duplicate-ingredient and allergy checks.",
              },
              {
                key: "shareLocation" as const,
                title: "Use my location for nearby pharmacies",
                body: "Location is used only to sort pharmacies by distance. It is never sold or shared.",
              },
            ].map((row) => (
              <div
                key={row.key}
                className="flex items-start justify-between gap-6 p-5"
              >
                <div>
                  <p className="font-medium text-ink">{row.title}</p>
                  <p className="text-sm text-muted-foreground">{row.body}</p>
                </div>
                <Switch
                  checked={profile[row.key]}
                  aria-label={row.title}
                  onCheckedChange={(v) => {
                    const next = { ...profile, [row.key]: v };
                    setProfile(next);
                    update({ profile: next });
                  }}
                />
              </div>
            ))}
          </section>
          <SafetyNotice title="Your data stays on this device in demo mode">
            No backend is connected, so your profile, prescriptions and
            reminders are stored in this browser only. Connecting Medora to a
            backend adds encryption at rest, access logging and data-export
            controls.
          </SafetyNotice>
          <Button
            variant="outline"
            onClick={() => {
              resetDemo();
              toast.success("Demo data reset", {
                description: "Local records were cleared.",
              });
            }}
          >
            <Trash2 className="size-4" aria-hidden /> Reset all local demo data
          </Button>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-4">
          <section className="surface space-y-4 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-primary" aria-hidden />
              <div>
                <p className="font-semibold text-ink">
                  Two-factor authentication
                </p>
                <p className="text-sm text-muted-foreground">
                  Requires a connected authentication provider. Not available in
                  this environment.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 size-5 text-primary" aria-hidden />
              <div>
                <p className="font-semibold text-ink">Password & sessions</p>
                <p className="text-sm text-muted-foreground">
                  Session management appears here once authentication is
                  connected.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                toast("Authentication provider not connected", {
                  description:
                    "Connect an auth backend to enable 2FA and session management.",
                })
              }
            >
              Review security options
            </Button>
          </section>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="surface overflow-hidden">
            <ul className="divide-y divide-border">
              {demoAuditEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{e.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.actor} · {e.target}
                    </p>
                  </div>
                  <p className="numeric text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
