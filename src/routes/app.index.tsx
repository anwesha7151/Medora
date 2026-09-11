import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarClock,
  FileScan,
  MapPin,
  MessageSquareText,
  PiggyBank,
  Pill,
  Search,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AvailabilityPill,
  ClinicalDisclaimer,
  DemoBadge,
  EmptyState,
  StatTile,
} from "@/components/common/primitives";
import { useAuth } from "@/lib/auth";
import { adherenceRate, useStore } from "@/lib/store";
import { formatMoney, getPharmacies, isOpenNow } from "@/services/medicines";
import { demoPrices } from "@/data/demo-catalog";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Your medicine dashboard — Medora" },
      {
        name: "description",
        content:
          "Search medicines, review prescriptions, track reminders, compare verified listings and find nearby pharmacies from one command centre.",
      },
      { property: "og:title", content: "Your medicine dashboard — Medora" },
      {
        property: "og:description",
        content:
          "Prescriptions, reminders, comparisons and nearby pharmacies in one place.",
      },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  { to: "/app/search", label: "Search a medicine", icon: Search },
  { to: "/app/prescriptions", label: "Upload prescription", icon: FileScan },
  { to: "/app/triage", label: "Symptom check", icon: Stethoscope },
  { to: "/app/assistant", label: "Ask the assistant", icon: MessageSquareText },
];

const rxStatusLabel: Record<
  "extracted" | "reviewed" | "verified" | "rejected",
  string
> = {
  extracted: "Needs review",
  reviewed: "Reviewed by you",
  verified: "Verified by pharmacy",
  rejected: "Rejected",
};

function Dashboard() {
  const { state, logDose } = useStore();
  const { profile, user } = useAuth();
  // Greet the signed-in account, not the demo persona.
  const firstName = (
    profile?.full_name ??
    user?.user_metadata?.["full_name"] ??
    ""
  )
    .toString()
    .trim()
    .split(" ")[0];
  const { data: pharmacies, isLoading } = useQuery({
    queryKey: ["pharmacies"],
    queryFn: getPharmacies,
  });

  const activeReminders = state.reminders.filter((r) => r.active);
  const adherence = adherenceRate(state.reminders);
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = activeReminders.flatMap((r) =>
    r.times.map((t) => ({
      reminder: r,
      time: t,
      state: r.log.find((l) => l.date === today && l.time === t)?.state,
    })),
  );
  const savings = state.comparisons.reduce(
    (sum, c) => sum + (c.highest - c.lowest),
    0,
  );
  const unreadAlerts = state.notifications.filter((n) => !n.read);
  const safetyAlerts = state.notifications
    .filter((n) => n.kind === "safety" && !n.read)
    .slice(0, 3);

  const currentMedicines: { name: string; detail: string; source: string }[] = [
    ...activeReminders.map((r) => ({
      name: `${r.medicineName} ${r.strength}`,
      detail: r.instruction,
      source: r.sourcePrescriptionId ? "From prescription" : "Added by you",
    })),
    ...state.profile.currentMedicines
      .filter(
        (m) =>
          !activeReminders.some((r) =>
            `${r.medicineName}`
              .toLowerCase()
              .includes(m.toLowerCase().split(" ")[0] ?? m),
          ),
      )
      .map((m) => ({
        name: m,
        detail: "No reminder scheduled",
        source: "Health profile",
      })),
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {firstName ? `Good day, ${firstName}` : "Good day"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <DemoBadge />
          <Button asChild variant="outline">
            <Link to="/app/history">Medicine history</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((a) => (
          <Link
            key={a.to}
            to={a.to as "/app/search"}
            className="surface group flex items-center gap-3 p-4 transition-shadow hover:shadow-soft"
          >
            <span className="grid size-9 place-items-center rounded-md bg-primary-soft text-primary">
              <a.icon className="size-4" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-ink">{a.label}</span>
            <ArrowUpRight
              className="ml-auto size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active medicines"
          value={String(activeReminders.length)}
          hint="From verified prescriptions"
          icon={Pill}
        />
        <StatTile
          label="Adherence (logged)"
          value={adherence == null ? "—" : `${adherence}%`}
          hint={
            adherence == null
              ? "No doses logged yet"
              : "Across all logged doses"
          }
          icon={CalendarClock}
          tone={adherence != null && adherence >= 80 ? "positive" : "default"}
        />
        <StatTile
          label="Potential savings"
          value={formatMoney(savings)}
          hint="Spread across saved comparisons (demo prices)"
          icon={PiggyBank}
        />
        <StatTile
          label="Open alerts"
          value={String(unreadAlerts.length)}
          hint="Reminders, prices and safety notices"
          icon={TriangleAlert}
          tone={unreadAlerts.length ? "attention" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Today&apos;s doses</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/reminders">Manage</Link>
            </Button>
          </div>
          {dueToday.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No doses scheduled today"
              description="Create a reminder from a prescription you have already reviewed."
              action={
                <Button asChild size="sm">
                  <Link to="/app/reminders">Add a reminder</Link>
                </Button>
              }
            />
          ) : (
            <ul className="mt-4 space-y-2">
              {dueToday.map(({ reminder, time, state: doseState }) => (
                <li
                  key={`${reminder.id}-${time}`}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-secondary/40 px-4 py-3"
                >
                  <span className="numeric w-14 text-sm font-semibold">
                    {time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {reminder.medicineName} {reminder.strength}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {reminder.instruction}
                    </p>
                  </div>
                  {doseState ? (
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {doseState}
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => logDose(reminder.id, time, "taken")}
                      >
                        Taken
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => logDose(reminder.id, time, "skipped")}
                      >
                        Skipped
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {adherence != null && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Logged adherence</span>
                <span className="numeric">{adherence}%</span>
              </div>
              <Progress value={adherence} />
            </div>
          )}
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Nearby pharmacies</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/pharmacies">See all</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {isLoading &&
              [0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            {pharmacies?.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                to="/app/pharmacies/$pharmacyId"
                params={{ pharmacyId: p.id }}
                className="flex items-start gap-3 rounded-md border border-border px-4 py-3 transition-colors hover:bg-secondary/50"
              >
                <MapPin className="mt-0.5 size-4 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.distanceKm} km ·{" "}
                    {isOpenNow(p) ? "Open now" : `Opens ${p.opensAt}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {safetyAlerts.length > 0 && (
        <section className="rounded-lg border border-warning/40 bg-warning-soft p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <TriangleAlert
                className="mt-0.5 size-5 shrink-0 text-warning-foreground"
                aria-hidden
              />
              <div>
                <h2 className="text-base font-bold text-ink">Safety alerts</h2>
                <ul className="mt-2 space-y-2">
                  {safetyAlerts.map((n) => (
                    <li key={n.id} className="text-sm">
                      <p className="font-medium text-foreground">{n.title}</p>
                      <p className="text-muted-foreground">{n.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/app/notifications">Review alerts</Link>
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Current medicines</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/interactions">Check interactions</Link>
            </Button>
          </div>
          {currentMedicines.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No medicines recorded"
              description="Add what you are taking in settings, or confirm a prescription line to build this list."
              action={
                <Button asChild size="sm">
                  <Link to="/app/settings">Update profile</Link>
                </Button>
              }
            />
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {currentMedicines.map((m) => (
                <li
                  key={m.name}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {m.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.detail}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                    {m.source}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Prescription status</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/prescriptions">Open prescriptions</Link>
            </Button>
          </div>
          {state.prescriptions.length === 0 ? (
            <EmptyState
              icon={FileScan}
              title="Nothing uploaded yet"
              description="Upload a prescription to see each line extracted with a confidence score."
              action={
                <Button asChild size="sm">
                  <Link to="/app/prescriptions">Upload one</Link>
                </Button>
              }
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {state.prescriptions.slice(0, 4).map((rx) => {
                const confirmed = rx.items.filter(
                  (i) => i.userConfirmed,
                ).length;
                return (
                  <li
                    key={rx.id}
                    className="rounded-md border border-border px-4 py-3"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <p className="truncate text-sm font-medium text-ink">
                        {rx.fileName}
                      </p>
                      <span className="shrink-0 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {rxStatusLabel[rx.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {confirmed} of {rx.items.length} lines confirmed ·{" "}
                      {rx.prescriberName}
                    </p>
                    <Progress
                      value={
                        rx.items.length
                          ? (confirmed / rx.items.length) * 100
                          : 0
                      }
                      className="mt-2 h-1.5"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Recent comparisons</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/compare">Open comparison</Link>
          </Button>
        </div>
        {state.comparisons.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No comparisons yet"
            description="Search for a medicine and compare equivalent products to see price differences."
          />
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {state.comparisons.map((c) => {
              const listings = demoPrices.filter((p) =>
                c.medicineIds.includes(p.medicineId),
              );
              const availability = listings.some(
                (l) => l.availability === "in_stock",
              )
                ? "in_stock"
                : "low_stock";
              return (
                <li key={c.id} className="rounded-md border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ink">{c.label}</p>
                    <AvailabilityPill value={availability} />
                  </div>
                  <p className="numeric mt-2 text-sm text-muted-foreground">
                    {formatMoney(c.lowest)} – {formatMoney(c.highest)} across{" "}
                    {c.medicineIds.length} products
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saved {new Date(c.createdAt).toLocaleDateString()} · same
                    active ingredient, strength and form
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ClinicalDisclaimer />
    </div>
  );
}
