import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bookmark,
  GitCompare,
  Info,
  TrendingDown,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AvailabilityPill,
  ClinicalDisclaimer,
  EmptyState,
  PageHeader,
  SafetyNotice,
} from "@/components/common/primitives";
import { MedicineComparativeView } from "@/components/medicine/MedicineComparativeView";
import type { OfferRow } from "@/services/medicines";
import {
  explainBestValue,
  formatMoney,
  getMedicineSync,
  getOffers,
} from "@/services/medicines";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/compare")({
  head: () => ({
    meta: [
      { title: "Compare medicine prices — Medora" },
      {
        name: "description",
        content:
          "Compare equivalent medicines side by side with price per unit, availability, distance and a transparent best-value explanation.",
      },
      { property: "og:title", content: "Compare medicine prices — Medora" },
      {
        property: "og:description",
        content: "Price per unit, availability and distance, explained.",
      },
    ],
  }),
  component: ComparePage,
});

type SortKey = "unit" | "pack" | "distance" | "availability";

const availabilityRank = {
  in_stock: 0,
  low_stock: 1,
  out_of_stock: 2,
} as const;

const sortOffers = (rows: OfferRow[], key: SortKey) =>
  [...rows].sort((a, b) => {
    if (key === "pack") return a.listing.price - b.listing.price;
    if (key === "distance")
      return a.pharmacy.distanceKm - b.pharmacy.distanceKm;
    if (key === "availability")
      return (
        availabilityRank[a.listing.availability] -
          availabilityRank[b.listing.availability] || a.unitPrice - b.unitPrice
      );
    return a.unitPrice - b.unitPrice;
  });

function ComparePage() {
  const { state, clearCompare, toggleCompare, saveComparison } = useStore();
  const ids = state.compareSelection;
  const [sort, setSort] = useState<SortKey>("unit");
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data: offers, isPending } = useQuery({
    queryKey: ["compare", ids],
    queryFn: () => getOffers(ids),
    enabled: ids.length > 0,
  });

  const filtered = (offers ?? []).filter(
    (o) => !inStockOnly || o.listing.availability !== "out_of_stock",
  );
  const rows = sortOffers(filtered, sort);
  const best = offers ? explainBestValue(offers) : null;

  /** Savings on a full pack, comparing the cheapest and dearest available listing. */
  const packSaving =
    best && best.worst.listing.price > best.best.listing.price
      ? best.worst.listing.price - best.best.listing.price
      : 0;

  const compositions = Array.from(
    new Set(
      ids
        .map((id) => getMedicineSync(id)?.compositionKey)
        .filter(Boolean) as string[],
    ),
  );
  const mixedComposition = compositions.length > 1;

  // For the Side-By-Side Clinical Comparison requirement
  const selectedMedicines = ids.map(getMedicineSync).filter(Boolean);

  if (ids.length === 0) {
    return (
      <div className="rise space-y-6">
        <PageHeader
          title="Comparative Medicine Analysis"
          description="Compare active ingredients, clinical side effects, and pricing dynamics side-by-side."
        />

        {/* Interactive Side-by-side Comparative View */}
        <MedicineComparativeView
          initialMedAId="med-dolo-650-tab"
          initialMedBId="med-calpol-650-tab"
        />

        <div className="surface p-5 text-center shadow-soft">
          <p className="text-xs text-muted-foreground">
            Looking for multi-pharmacy live price comparisons? Search the
            catalogue and select items to view dispensary listings.
          </p>
          <Button asChild className="mt-3 text-xs" size="sm">
            <Link to="/app/search">Explore All Medicines</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rise space-y-6">
      <PageHeader
        title="Compare Prices & Clinical Differences"
        demo
        description="Every row is one listing at one pharmacy. Pack prices are normalised to a price per unit so different pack sizes compare honestly."
        actions={
          <>
            <Button variant="ghost" onClick={clearCompare}>
              <X className="size-4" aria-hidden /> Clear
            </Button>
            <Button
              variant="outline"
              disabled={!offers?.length}
              onClick={() => {
                if (!offers?.length) return;
                const prices = offers.map((o) => o.listing.price);
                saveComparison({
                  id: `cmp-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                  compositionKey: offers[0]!.medicine.compositionKey,
                  label: Array.from(
                    new Set(offers.map((o) => o.medicine.brandName)),
                  ).join(" vs "),
                  medicineIds: ids,
                  lowest: Math.min(...prices),
                  highest: Math.max(...prices),
                });
                toast.success("Comparison saved", {
                  description:
                    "It now appears on your dashboard and in your history.",
                });
              }}
            >
              <Bookmark className="size-4" aria-hidden /> Save comparison
            </Button>
          </>
        }
      />

      {/* Multi-Medicine Side-by-side Active Ingredients, Uses, Side Effects & Pricing View */}
      <MedicineComparativeView medicineIds={ids} />

      {/* Matching criteria — always visible, never implied */}
      <section className="rounded-lg border border-border bg-secondary/50 p-5">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-ink">
              How Medora matches these products
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Products are grouped only when all three match exactly: the same{" "}
              <strong className="font-semibold text-foreground">
                active ingredient
              </strong>
              , the same{" "}
              <strong className="font-semibold text-foreground">
                strength
              </strong>
              , and the same{" "}
              <strong className="font-semibold text-foreground">
                dosage form
              </strong>
              . Matching on those three does not mean the products are equally
              suitable for you — excipients, tolerability, manufacturing quality
              and clinical history all differ, and only a pharmacist or
              prescriber can judge a substitution.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {compositions.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-xs text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {mixedComposition && (
        <SafetyNotice
          tone="warning"
          title="These products are not equivalent to each other"
        >
          Your selection contains more than one composition, so this table
          compares different products rather than alternatives of the same one.
          Prices below are still per unit, but do not read them as substitution
          options.
        </SafetyNotice>
      )}

      <div className="flex flex-wrap gap-2">
        {ids.map((id) => {
          const m = getMedicineSync(id);
          return (
            <button
              key={id}
              onClick={() => toggleCompare(id)}
              aria-label={`Remove ${m?.brandName ?? id} from the comparison`}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-secondary"
            >
              {m?.brandName ?? id}
              <X className="size-3.5 text-muted-foreground" aria-hidden />
            </button>
          );
        })}
      </div>

      {/* Side-by-Side Clinical Comparison */}
      {selectedMedicines.length === 2 && (
        <section className="surface p-0 overflow-hidden">
          <div className="border-b border-border bg-muted/40 p-4">
            <h3 className="font-semibold text-sm">Clinical Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                  <TableHead className="w-[150px] font-semibold text-muted-foreground">
                    Property
                  </TableHead>
                  <TableHead className="font-bold text-ink w-1/2">
                    {selectedMedicines[0]?.brandName}
                  </TableHead>
                  <TableHead className="font-bold text-ink w-1/2 border-l border-border">
                    {selectedMedicines[1]?.brandName}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">
                    Dosage & Form
                  </TableCell>
                  <TableCell>
                    {selectedMedicines[0]?.form} (
                    {selectedMedicines[0]?.packSize})
                  </TableCell>
                  <TableCell className="border-l border-border">
                    {selectedMedicines[1]?.form} (
                    {selectedMedicines[1]?.packSize})
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">
                    Active Ingredients
                  </TableCell>
                  <TableCell>
                    {selectedMedicines[0]?.activeIngredients.map((a) => (
                      <div key={a.name}>
                        {a.name}{" "}
                        <span className="text-muted-foreground ml-1">
                          {a.strength}
                        </span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="border-l border-border">
                    {selectedMedicines[1]?.activeIngredients.map((a) => (
                      <div key={a.name}>
                        {a.name}{" "}
                        <span className="text-muted-foreground ml-1">
                          {a.strength}
                        </span>
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">
                    Uses Summary
                  </TableCell>
                  <TableCell className="text-sm">
                    {selectedMedicines[0]?.usesSummary}
                  </TableCell>
                  <TableCell className="border-l border-border text-sm">
                    {selectedMedicines[1]?.usesSummary}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">
                    Common Side Effects
                  </TableCell>
                  <TableCell>
                    <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
                      {selectedMedicines[0]?.commonSideEffects.map((se) => (
                        <li key={se}>{se}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="border-l border-border">
                    <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
                      {selectedMedicines[1]?.commonSideEffects.map((se) => (
                        <li key={se}>{se}</li>
                      ))}
                    </ul>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">
                    Manufacturer
                  </TableCell>
                  <TableCell className="text-sm">
                    {selectedMedicines[0]?.manufacturer}
                  </TableCell>
                  <TableCell className="border-l border-border text-sm">
                    {selectedMedicines[1]?.manufacturer}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-[200px_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="cmp-sort">Sort listings by</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger id="cmp-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unit">Lowest price per unit</SelectItem>
              <SelectItem value="pack">Lowest pack price</SelectItem>
              <SelectItem value="distance">Nearest pharmacy</SelectItem>
              <SelectItem value="availability">In stock first</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch
            id="cmp-stock"
            checked={inStockOnly}
            onCheckedChange={setInStockOnly}
          />
          <Label htmlFor="cmp-stock">Hide out-of-stock listings</Label>
        </div>
      </div>

      {isPending ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : (
        <>
          {best && (
            <section className="surface border-primary/30 bg-primary-soft/50 p-6">
              <div className="flex items-start gap-3">
                <TrendingDown
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden
                />
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold text-ink">
                    Lowest unit price: {best.best.medicine.brandName} at{" "}
                    {best.best.pharmacy.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatMoney(best.savingPerUnit)} less per unit than the
                    most expensive available listing (
                    {Math.round(best.savingPercent)}% lower)
                    {packSaving > 0 && (
                      <> — about {formatMoney(packSaving)} on a full pack.</>
                    )}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                    {best.reasons.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    &ldquo;Lowest unit price&rdquo; describes this list only. It
                    is not a quality, safety or suitability judgement, and it is
                    not a recommendation to switch.
                  </p>
                  <div className="mt-4">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to="/app/pharmacies/$pharmacyId"
                        params={{ pharmacyId: best.best.pharmacy.id }}
                      >
                        View {best.best.pharmacy.name}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {rows.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No listings match this filter"
              description="Every listing for the selected products is currently out of stock in the demo directory."
              action={
                <Button variant="outline" onClick={() => setInStockOnly(false)}>
                  Show all listings
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="surface hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Pharmacy</TableHead>
                      <TableHead>Pack size</TableHead>
                      <TableHead className="text-right">Pack price</TableHead>
                      <TableHead className="text-right">Per unit</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((o) => (
                      <TableRow key={o.listing.id}>
                        <TableCell>
                          <Link
                            to="/app/medicine/$medicineId"
                            params={{ medicineId: o.medicine.id }}
                            className="font-medium text-ink hover:underline"
                          >
                            {o.medicine.brandName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {o.medicine.genericName} · {o.medicine.form}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {o.medicine.manufacturer}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Link
                            to="/app/pharmacies/$pharmacyId"
                            params={{ pharmacyId: o.pharmacy.id }}
                            className="hover:underline"
                          >
                            {o.pharmacy.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {o.listing.packSize}
                        </TableCell>
                        <TableCell className="numeric text-right font-semibold">
                          {formatMoney(o.listing.price)}
                        </TableCell>
                        <TableCell className="numeric text-right">
                          {formatMoney(o.unitPrice)}
                        </TableCell>
                        <TableCell>
                          <AvailabilityPill value={o.listing.availability} />
                        </TableCell>
                        <TableCell className="numeric text-right text-sm">
                          {o.pharmacy.distanceKm} km
                        </TableCell>
                        <TableCell className="max-w-40 text-xs text-muted-foreground">
                          {o.listing.provenance.source}
                          <span className="block">
                            {o.listing.provenance.verified
                              ? "Verified feed"
                              : "Unverified demo feed"}{" "}
                            · {o.listing.provenance.updatedAt}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <ul className="space-y-3 md:hidden">
                {rows.map((o) => (
                  <li key={o.listing.id} className="surface p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <Link
                          to="/app/medicine/$medicineId"
                          params={{ medicineId: o.medicine.id }}
                          className="truncate font-semibold text-ink hover:underline"
                        >
                          {o.medicine.brandName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {o.medicine.manufacturer} · {o.listing.packSize}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="numeric font-semibold">
                          {formatMoney(o.listing.price)}
                        </p>
                        <p className="numeric text-xs text-muted-foreground">
                          {formatMoney(o.unitPrice)} / unit
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                      <AvailabilityPill value={o.listing.availability} />
                      <span>{o.pharmacy.name}</span>
                      <span className="numeric">
                        {o.pharmacy.distanceKm} km
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Source: {o.listing.provenance.source} ·{" "}
                      {o.listing.provenance.verified
                        ? "verified feed"
                        : "unverified demo feed"}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <SafetyNotice title="Prices are demo data">
        Listings in this environment are sample records with fixed timestamps.
        Connecting a live pricing provider replaces them with verified,
        timestamped pharmacy data.
      </SafetyNotice>
      <ClinicalDisclaimer />
    </div>
  );
}
