import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  Camera,
  GitCompareArrows,
  Search as SearchIcon,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DemoBadge,
  EmptyState,
  PageHeader,
  SafetyNotice,
} from "@/components/common/primitives";
import { MedicineCard } from "@/components/medicine/MedicineCard";
import { MedicineBottleScanner } from "@/components/medication/MedicineBottleScanner";
import { demoPrices } from "@/data/demo-catalog";
import { searchMedicines } from "@/services/medicines";
import { getProvider } from "@/services/medicine-provider";
import { useStore } from "@/lib/store";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  form: fallback(z.string(), "all").default("all"),
  supply: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/app/search")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Find a medicine — Medora" },
      {
        name: "description",
        content:
          "Search by brand name, generic name or active ingredient and see equivalent products with transparent composition matching.",
      },
      { property: "og:title", content: "Find a medicine — Medora" },
      {
        property: "og:description",
        content: "Search by brand, generic name or active ingredient.",
      },
    ],
  }),
  component: SearchPage,
});

const lowestFor = (medicineId: string) => {
  const prices = demoPrices
    .filter((p) => p.medicineId === medicineId)
    .map((p) => p.price);
  return prices.length ? Math.min(...prices) : undefined;
};

function SearchPage() {
  const { q, form, supply } = Route.useSearch();
  const navigate = useNavigate({ from: "/app/search" });
  const { state, toggleCompare, clearCompare } = useStore();
  const [showScanner, setShowScanner] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["medicines", q],
    queryFn: () => searchMedicines(q),
  });

  const results = (data ?? []).filter(
    (m) =>
      (form === "all" || m.form === form) &&
      (supply === "all" ||
        (supply === "rx" ? m.prescriptionOnly : !m.prescriptionOnly)),
  );

  const setParam = (key: "q" | "form" | "supply", value: string) =>
    void navigate({ to: ".", search: (prev) => ({ ...prev, [key]: value }) });

  return (
    <div className="rise space-y-6">
      <PageHeader
        title="Find a medicine"
        demo
        description="Search by brand name, generic name, active ingredient or manufacturer. Equivalence in Medora means the same active ingredient, strength and dosage form — never an assumption about quality."
        actions={
          <Button
            variant={showScanner ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowScanner(!showScanner)}
            className="gap-2 text-xs"
          >
            <Camera className="size-4 text-primary" />
            {showScanner
              ? "Close Bottle Scanner"
              : "Scan Medicine Bottle / Label"}
          </Button>
        }
      />

      {/* Expandable Bottle Scanner */}
      {showScanner && (
        <div className="rise surface p-5 shadow-soft border-primary/40 bg-gradient-to-b from-card to-secondary/30">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink">
              Camera & AI Vision Medicine Bottle Scanner
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScanner(false)}
              className="h-7 text-xs"
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <MedicineBottleScanner
            onScanComplete={(med) => {
              if (med?.brandName) {
                setParam("q", med.brandName);
              }
              setShowScanner(false);
            }}
          />
        </div>
      )}

      <div className="surface grid gap-4 p-5 sm:grid-cols-[1fr_170px_190px]">
        <div className="space-y-1.5">
          <Label htmlFor="q">Search</Label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="q"
              value={q}
              maxLength={80}
              placeholder="e.g. Paracetamol, Zyracet, Metformin"
              className="pl-9"
              onChange={(e) => setParam("q", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form">Dosage form</Label>
          <Select value={form} onValueChange={(v) => setParam("form", v)}>
            <SelectTrigger id="form">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "all",
                "Tablet",
                "Capsule",
                "Syrup",
                "Suspension",
                "Inhaler",
                "Injection",
              ].map((f) => (
                <SelectItem key={f} value={f}>
                  {f === "all" ? "All forms" : f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supply">Supply</Label>
          <Select value={supply} onValueChange={(v) => setParam("supply", v)}>
            <SelectTrigger id="supply">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="otc">Over the counter</SelectItem>
              <SelectItem value="rx">Prescription-only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.compareSelection.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/35 bg-primary-soft px-4 py-3">
          <GitCompareArrows className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-medium text-ink">
            {state.compareSelection.length} product
            {state.compareSelection.length > 1 ? "s" : ""} selected for
            comparison
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearCompare}>
              <X className="size-3.5" aria-hidden /> Clear
            </Button>
            <Button asChild size="sm">
              <Link to="/app/compare">Compare selected</Link>
            </Button>
          </div>
        </div>
      )}

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No products matched"
          description="Try the generic name or active ingredient instead of the brand, or clear the filters."
          action={
            <Button
              variant="outline"
              onClick={() =>
                void navigate({
                  to: ".",
                  search: { q: "", form: "all", supply: "all" },
                })
              }
            >
              Reset search
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {results.length} product{results.length > 1 ? "s" : ""} in the
            catalogue
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((m) => (
              <MedicineCard
                key={m.id}
                medicine={m}
                lowestPrice={lowestFor(m.id)}
                selected={state.compareSelection.includes(m.id)}
                onToggleCompare={() => toggleCompare(m.id)}
              />
            ))}
          </div>
        </>
      )}

      <SafetyNotice title="What Medora will not do">
        Medora does not recommend which medicine you should take, and it does
        not imply that products with the same composition are equal in quality,
        tolerability or suitability for you. A pharmacist decides whether a
        substitution is appropriate.
      </SafetyNotice>
      <div className="flex justify-end">
        {getProvider().isLive ? (
          <DemoBadge label="Live catalogue" />
        ) : (
          <DemoBadge label="Demo catalogue" />
        )}
      </div>
    </div>
  );
}
