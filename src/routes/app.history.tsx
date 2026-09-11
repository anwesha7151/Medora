import { createFileRoute, Link } from "@tanstack/react-router";
import { History, Scale, ShoppingBag, Bell, FileText } from "lucide-react";
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ClinicalDisclaimer,
  EmptyState,
  PageHeader,
} from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/services/medicines";

export const Route = createFileRoute("/app/history")({
  head: () => ({
    meta: [
      { title: "Activity history — Medora" },
      {
        name: "description",
        content:
          "A single timeline of your price comparisons, reservations, prescription uploads and dose logs on this device.",
      },
      { property: "og:title", content: "Activity history — Medora" },
      {
        property: "og:description",
        content: "One timeline of everything you have done in Medora.",
      },
    ],
  }),
  component: HistoryPage,
});

type Kind = "comparison" | "order" | "prescription" | "dose";

interface Entry {
  id: string;
  at: string;
  kind: Kind;
  title: string;
  detail: string;
  to?: { label: string } | undefined;
}

const kindMeta: Record<Kind, { label: string; icon: LucideIcon }> = {
  comparison: { label: "Comparison", icon: Scale },
  order: { label: "Reservation", icon: ShoppingBag },
  prescription: { label: "Prescription", icon: FileText },
  dose: { label: "Dose log", icon: Bell },
};

function HistoryPage() {
  const { state } = useStore();

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];

    state.comparisons.forEach((c) =>
      list.push({
        id: c.id,
        at: c.createdAt,
        kind: "comparison",
        title: c.label,
        detail: `${c.medicineIds.length} products compared · ${formatMoney(c.lowest)} to ${formatMoney(c.highest)}`,
      }),
    );

    state.orders.forEach((o) =>
      list.push({
        id: o.id,
        at: o.placedAt,
        kind: "order",
        title: `Reservation at ${o.pharmacyName}`,
        detail: `${o.items.length} item${o.items.length === 1 ? "" : "s"} · ${formatMoney(o.total)} · ${o.status.replace(/_/g, " ")}`,
      }),
    );

    state.prescriptions.forEach((p) =>
      list.push({
        id: p.id,
        at: p.uploadedAt,
        kind: "prescription",
        title: p.fileName,
        detail: `${p.items.length} line${p.items.length === 1 ? "" : "s"} extracted · ${p.status} · ${p.prescriberName}`,
      }),
    );

    state.reminders.forEach((r) =>
      r.log.forEach((entry, idx) =>
        list.push({
          id: `${r.id}-${idx}`,
          at: `${entry.date}T${entry.time}:00`,
          kind: "dose",
          title: `${r.medicineName} ${r.strength}`,
          detail:
            entry.state === "taken"
              ? `Marked taken at ${entry.time}`
              : `Skipped at ${entry.time}`,
        }),
      ),
    );

    return list.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [state.comparisons, state.orders, state.prescriptions, state.reminders]);

  const render = (list: Entry[]) =>
    list.length === 0 ? (
      <EmptyState
        icon={History}
        title="Nothing recorded yet"
        description="Compare prices, reserve a medicine or log a dose and it will show up in this timeline."
        action={
          <Button asChild>
            <Link to="/app/search">Search medicines</Link>
          </Button>
        }
      />
    ) : (
      <ol className="space-y-3">
        {list.map((e) => {
          const Icon = kindMeta[e.kind].icon;
          return (
            <li
              key={`${e.kind}-${e.id}`}
              className="surface grid grid-cols-[auto_minmax(0,1fr)] gap-4 p-4"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-secondary text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-ink">{e.title}</p>
                  <Badge variant="outline">{kindMeta[e.kind].label}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
                <p
                  className="mt-1 text-xs text-muted-foreground/80"
                  suppressHydrationWarning
                >
                  {new Date(e.at).toLocaleString()}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity history"
        demo
        description="Everything Medora has recorded on this device. Nothing here is shared with a pharmacy or clinician unless you send it."
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({entries.length})</TabsTrigger>
          <TabsTrigger value="comparison">Comparisons</TabsTrigger>
          <TabsTrigger value="order">Reservations</TabsTrigger>
          <TabsTrigger value="prescription">Prescriptions</TabsTrigger>
          <TabsTrigger value="dose">Doses</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-5">
          {render(entries)}
        </TabsContent>
        {(["comparison", "order", "prescription", "dose"] as Kind[]).map(
          (k) => (
            <TabsContent key={k} value={k} className="mt-5">
              {render(entries.filter((e) => e.kind === k))}
            </TabsContent>
          ),
        )}
      </Tabs>

      <ClinicalDisclaimer />
    </div>
  );
}
