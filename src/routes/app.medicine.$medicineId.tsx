import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Globe,
  MapPin,
  Package,
  ShoppingCart,
  Thermometer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveGoogleSearchGrounding } from "@/components/ai/LiveGoogleSearchGrounding";
import {
  AvailabilityPill,
  ClinicalDisclaimer,
  EmptyState,
  ProvenanceLine,
  RxPill,
  SafetyNotice,
  SectionHeading,
} from "@/components/common/primitives";
import { getMedicineSync } from "@/services/medicines";
import { getEquivalents, getOffers, formatMoney } from "@/services/medicines";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/medicine/$medicineId")({
  loader: ({ params }) => {
    const medicine = getMedicineSync(params.medicineId);
    if (!medicine) throw notFound();
    return { brandName: medicine.brandName, genericName: medicine.genericName };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Medicine unavailable — Medora" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.brandName} (${loaderData.genericName}) — Medora`;
    const description = `Composition, uses, warnings, storage and verified local pricing for ${loaderData.brandName}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: () => (
    <EmptyState
      icon={AlertTriangle}
      title="Medicine not found"
      description="This product is not in the catalogue."
      action={
        <Button asChild>
          <Link to="/app/search">Back to search</Link>
        </Button>
      }
    />
  ),
  component: MedicineDetail,
});

function MedicineDetail() {
  const { medicineId } = Route.useParams();
  const { addToCart } = useStore();
  const medicine = getMedicineSync(medicineId)!;

  const { data: equivalents } = useQuery({
    queryKey: ["equivalents", medicineId],
    queryFn: () => getEquivalents(medicine),
  });
  const { data: offers, isPending } = useQuery({
    queryKey: ["offers", medicineId],
    queryFn: () => getOffers([medicineId]),
  });

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/app/search">
          <ArrowLeft className="size-4" aria-hidden /> Back to search
        </Link>
      </Button>

      <header className="surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {medicine.brandName}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {medicine.genericName} · {medicine.activeIngredients[0]?.strength}{" "}
              · {medicine.form}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RxPill prescriptionOnly={medicine.prescriptionOnly} />
            <Button
              onClick={() => {
                addToCart({
                  medicineId: medicine.id,
                  name: medicine.brandName,
                  qty: 1,
                  price: offers?.[0]?.listing.price ?? 0,
                  prescriptionOnly: medicine.prescriptionOnly,
                });
                toast.success("Added to basket", {
                  description: medicine.prescriptionOnly
                    ? "A valid prescription is required before this can be dispensed."
                    : "Reserve at a pharmacy from your basket.",
                });
              }}
            >
              <ShoppingCart className="size-4" aria-hidden /> Add to basket
            </Button>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Active ingredient",
              medicine.activeIngredients.map((a) => a.name).join(" + "),
            ],
            [
              "Strength",
              medicine.activeIngredients.map((a) => a.strength).join(" / "),
            ],
            ["Pack size", medicine.packSize],
            ["Manufacturer", medicine.manufacturer],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-md border border-border bg-secondary/40 p-3"
            >
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {k}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <ProvenanceLine provenance={medicine.provenance} />
        </div>
      </header>

      <Tabs defaultValue="about">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 max-w-xl h-auto p-1 rounded-xl bg-muted/60 gap-1">
          <TabsTrigger
            value="about"
            className="rounded-lg text-xs font-semibold py-2"
          >
            About
          </TabsTrigger>
          <TabsTrigger
            value="prices"
            className="rounded-lg text-xs font-semibold py-2"
          >
            Local prices
          </TabsTrigger>
          <TabsTrigger
            value="equivalents"
            className="rounded-lg text-xs font-semibold py-2"
          >
            Equivalents
          </TabsTrigger>
          <TabsTrigger
            value="grounding"
            className="rounded-lg text-xs font-bold py-2 gap-1 text-primary data-[state=active]:text-primary"
          >
            <Globe className="size-3.5" /> Live Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-6 space-y-5">
          <section className="surface p-6">
            <SectionHeading title="What it is used for" />
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {medicine.usesSummary}
            </p>
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="surface p-6">
              <SectionHeading title="Commonly reported side effects" />
              <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                {medicine.commonSideEffects.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
            <section className="surface p-6">
              <SectionHeading title="Warnings" />
              <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                {medicine.warnings.map((s) => (
                  <li key={s} className="flex gap-2">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-warning-foreground"
                      aria-hidden
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <section className="surface flex items-start gap-3 p-6">
            <Thermometer className="mt-0.5 size-5 text-primary" aria-hidden />
            <div>
              <p className="font-semibold text-ink">Storage</p>
              <p className="text-sm text-muted-foreground">
                {medicine.storage}
              </p>
            </div>
          </section>
          <SafetyNotice title="No dosing guidance here — by design">
            Medora never suggests a dose, a schedule, or whether this product is
            right for you. Dose comes from your prescriber; suitability is a
            pharmacist&apos;s call.
          </SafetyNotice>
        </TabsContent>

        <TabsContent value="prices" className="mt-6 space-y-3">
          {isPending &&
            [0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          {offers?.map((o) => (
            <div
              key={o.listing.id}
              className="surface flex flex-wrap items-center gap-4 p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" aria-hidden />
                  <Link
                    to="/app/pharmacies/$pharmacyId"
                    params={{ pharmacyId: o.pharmacy.id }}
                    className="font-semibold text-ink hover:underline"
                  >
                    {o.pharmacy.name}
                  </Link>
                  <AvailabilityPill value={o.listing.availability} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.pharmacy.distanceKm} km · pack of {o.units} ·{" "}
                  {formatMoney(o.unitPrice)} per unit · updated{" "}
                  {o.listing.updatedAt}
                </p>
              </div>
              <p className="numeric font-display text-xl font-bold text-ink">
                {formatMoney(o.listing.price)}
              </p>
            </div>
          ))}
          {offers?.length === 0 && (
            <EmptyState
              icon={Package}
              title="No listings for this product"
              description="No pharmacy in the catalogue lists this pack size right now."
            />
          )}
        </TabsContent>

        <TabsContent value="equivalents" className="mt-6 space-y-3">
          <SafetyNotice title="How equivalence is decided" tone="info">
            Products are grouped only when the active ingredient, strength and
            dosage form match exactly ({medicine.compositionKey}). Excipients,
            coatings and tolerability can still differ — a pharmacist decides
            whether a swap is appropriate.
          </SafetyNotice>
          {equivalents?.length ? (
            equivalents.map((m) => (
              <Link
                key={m.id}
                to="/app/medicine/$medicineId"
                params={{ medicineId: m.id }}
                className="surface flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-soft"
              >
                <div>
                  <p className="font-semibold text-ink">{m.brandName}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.manufacturer} · {m.packSize}
                  </p>
                </div>
                <RxPill prescriptionOnly={m.prescriptionOnly} />
              </Link>
            ))
          ) : (
            <EmptyState
              icon={Package}
              title="No equivalents in the catalogue"
              description="Nothing else shares this exact composition key."
            />
          )}
        </TabsContent>

        <TabsContent value="grounding" className="mt-6 space-y-4">
          <LiveGoogleSearchGrounding
            initialQuery={`${medicine.brandName} (${medicine.genericName}) latest safety alerts, clinical indications and NPPA ceiling price India`}
            initialContextType="drug_safety"
            patientContext={`Product: ${medicine.brandName} (${medicine.genericName}) by ${medicine.manufacturer}. Composition: ${medicine.compositionKey}. Schedule: ${medicine.prescriptionOnly ? "Prescription Only (Schedule H/H1)" : "OTC"}.`}
          />
        </TabsContent>
      </Tabs>

      <ClinicalDisclaimer />
    </div>
  );
}
