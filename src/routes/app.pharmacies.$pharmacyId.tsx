import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AvailabilityPill,
  EmptyState,
  ProvenanceLine,
  SectionHeading,
} from "@/components/common/primitives";
import { demoPharmacies } from "@/data/demo-catalog";
import { formatMoney, getPharmacyStock, isOpenNow } from "@/services/medicines";

export const Route = createFileRoute("/app/pharmacies/$pharmacyId")({
  loader: ({ params }) => {
    const pharmacy = demoPharmacies.find((p) => p.id === params.pharmacyId);
    if (!pharmacy) throw notFound();
    return {
      id: pharmacy.id,
      name: pharmacy.name,
      city: pharmacy.city,
      address: pharmacy.address,
      phone: pharmacy.phone,
      opensAt: pharmacy.opensAt,
      closesAt: pharmacy.closesAt,
      open24h: pharmacy.open24h,
      coords: pharmacy.coords,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Pharmacy unavailable — Medora" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.name} — Medora`;
    const description = `Opening hours, services, licence details and current stock at ${loaderData.name}, ${loaderData.city}.`;
    const url = `https://medora-health-guide.lovable.app/app/pharmacies/${loaderData.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Pharmacy",
            name: loaderData.name,
            url,
            telephone: loaderData.phone,
            address: {
              "@type": "PostalAddress",
              streetAddress: loaderData.address,
              addressLocality: loaderData.city,
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: loaderData.coords.lat,
              longitude: loaderData.coords.lng,
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
                opens: loaderData.open24h ? "00:00" : loaderData.opensAt,
                closes: loaderData.open24h ? "23:59" : loaderData.closesAt,
              },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <EmptyState
      icon={MapPin}
      title="Pharmacy not found"
      description="This pharmacy is not in the demo dataset."
    />
  ),
  component: PharmacyDetail,
});

function PharmacyDetail() {
  const { pharmacyId } = Route.useParams();
  const pharmacy = demoPharmacies.find((p) => p.id === pharmacyId)!;
  const { data: stock, isPending } = useQuery({
    queryKey: ["pharmacy-stock", pharmacyId],
    queryFn: () => getPharmacyStock(pharmacyId),
  });

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/app/pharmacies">
          <ArrowLeft className="size-4" aria-hidden /> All pharmacies
        </Link>
      </Button>

      <header className="surface p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {pharmacy.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {pharmacy.address}, {pharmacy.city}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden /> {pharmacy.distanceKm} km
            away
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {pharmacy.open24h
              ? "Open 24 hours"
              : `${pharmacy.opensAt} – ${pharmacy.closesAt}`}{" "}
            · {isOpenNow(pharmacy) ? "open now" : "closed"}
          </span>
          <a
            href={`tel:${pharmacy.phone}`}
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <Phone className="size-4" aria-hidden /> {pharmacy.phone}
          </a>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-success" aria-hidden /> Licence{" "}
            {pharmacy.licenseId}
          </span>
        </div>
        <div className="mt-4">
          <ProvenanceLine provenance={pharmacy.provenance} />
        </div>
      </header>

      <section className="surface p-6">
        <SectionHeading title="Services" />
        <div className="mt-3 flex flex-wrap gap-2">
          {pharmacy.services.map((s) => (
            <span
              key={s}
              className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Listed stock"
          description="Availability is reported by the pharmacy and can change before you arrive. Call ahead for prescription-only items."
        />
        {isPending &&
          [0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        {stock?.map((row) => (
          <div
            key={row.listing.id}
            className="surface flex flex-wrap items-center gap-4 p-4"
          >
            <div className="min-w-0 flex-1">
              <Link
                to="/app/medicine/$medicineId"
                params={{ medicineId: row.medicine.id }}
                className="font-medium text-ink hover:underline"
              >
                {row.medicine.brandName}
              </Link>
              <p className="text-xs text-muted-foreground">
                {row.medicine.genericName} · {row.listing.packSize}
              </p>
            </div>
            <AvailabilityPill value={row.listing.availability} />
            <p className="numeric font-semibold">
              {formatMoney(row.listing.price)}
            </p>
          </div>
        ))}
        {stock?.length === 0 && (
          <EmptyState
            icon={MapPin}
            title="No listings"
            description="This pharmacy has no demo listings."
          />
        )}
      </section>
    </div>
  );
}
