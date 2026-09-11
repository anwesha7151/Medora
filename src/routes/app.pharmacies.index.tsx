import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Copy,
  List,
  Map as MapIcon,
  MapPin,
  Phone,
  Radio,
  Star,
  Store,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EmptyState,
  IntegrationNotConnected,
  PageHeader,
} from "@/components/common/primitives";
import type { Pharmacy } from "@/lib/domain";
import { getPharmacies, isOpenNow } from "@/services/medicines";
import { PharmacySearchGrounding } from "@/components/pharmacy/PharmacySearchGrounding";
import { GooglePharmacyMap } from "@/components/pharmacy/GooglePharmacyMap";
import { LeafletPharmacyMap } from "@/components/pharmacy/LeafletPharmacyMap";

export const Route = createFileRoute("/app/pharmacies/")({
  head: () => ({
    meta: [
      { title: "Nearby pharmacies — Medora" },
      {
        name: "description",
        content:
          "Find licensed pharmacies near you with opening hours, services, ratings and current stock signals.",
      },
      { property: "og:title", content: "Nearby pharmacies — Medora" },
      {
        property: "og:description",
        content: "Licensed pharmacies with hours, services and stock signals.",
      },
    ],
  }),
  component: PharmaciesPage,
});

type SortKey = "distance" | "rating" | "open";

function PharmacyCard({ pharmacy: p }: { pharmacy: Pharmacy }) {
  const open = isOpenNow(p);
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(`${p.name}, ${p.address}, ${p.city}`);
      toast.success("Address copied", {
        description: "Turn-by-turn directions need a connected maps provider.",
      });
    } catch {
      toast.error("Could not copy the address on this device.");
    }
  };

  return (
    <article className="surface flex flex-col gap-3 p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-ink">
            {p.name}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{p.address}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium">
          <Star className="size-3 text-warning-foreground" aria-hidden />
          <span className="numeric">{p.rating}</span>
          <span className="text-muted-foreground">({p.reviews})</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5 shrink-0" aria-hidden /> {p.distanceKm} km
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {p.open24h ? "Open 24 hours" : `${p.opensAt} – ${p.closesAt}`}
        </span>
        <span className="inline-flex items-center gap-1">
          <Phone className="size-3.5 shrink-0" aria-hidden /> {p.phone}
        </span>
      </div>

      <span
        className={
          open
            ? "w-fit rounded-full border border-success/35 bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success"
            : "w-fit rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
        }
      >
        {open ? "Open now" : `Closed · opens ${p.opensAt}`}
      </span>

      <div className="flex flex-wrap gap-1.5">
        {p.services.map((s) => (
          <span
            key={s}
            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">Licence {p.licenseId}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => void copyAddress()}>
            <Copy className="size-3.5" aria-hidden /> Directions
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              to="/app/pharmacies/$pharmacyId"
              params={{ pharmacyId: p.id }}
            >
              View & reserve
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function PharmaciesPage() {
  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("distance");
  const [radius, setRadius] = useState<number>(5);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "initial" | "loading" | "granted" | "denied"
  >("initial");

  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(
    null,
  );

  const { data, isPending } = useQuery({
    queryKey: ["pharmacies"],
    queryFn: getPharmacies,
  });

  const handleUseLocation = () => {
    setLocationStatus("loading");
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLocationStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationStatus("granted");
        toast.success("Location updated");
      },
      () => {
        setLocationStatus("denied");
        toast.error("Could not access your location. Using default center.");
      },
    );
  };

  // Calculate distance if we have user location, otherwise use demo distance
  const calculateDistance = (pLat: number, pLng: number) => {
    if (!userLocation) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (pLat - userLocation.lat) * (Math.PI / 180);
    const dLon = (pLng - userLocation.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * (Math.PI / 180)) *
        Math.cos(pLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const list = (data ?? [])
    .map((p) => {
      const pLat = p.coords?.lat ?? 19.076;
      const pLng = p.coords?.lng ?? 72.8777;
      const realDist = calculateDistance(pLat, pLng);
      return {
        ...p,
        coords: p.coords || { lat: 19.076, lng: 72.8777 },
        services: Array.isArray(p.services) ? p.services : [],
        distanceKm: realDist !== null ? realDist : (p.distanceKm ?? 1.2),
      };
    })
    .filter(
      (p) =>
        (!openOnly || isOpenNow(p)) &&
        `${p.name} ${p.address} ${p.city} ${p.services.join(" ")}`
          .toLowerCase()
          .includes(q.toLowerCase()),
    )
    .filter((p) => p.distanceKm <= radius)
    .sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "open")
        return (
          Number(isOpenNow(b)) - Number(isOpenNow(a)) ||
          a.distanceKm - b.distanceKm
        );
      return a.distanceKm - b.distanceKm;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacies & Live Stock Grounding"
        demo
        description="Verify real-time stock availability, dispensary opening hours, and grounded regional pharmacy pricing before you travel."
      />

      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="grounded" className="gap-2">
            <Radio className="size-4 text-primary" /> Live Stock Grounding Tool
          </TabsTrigger>
          <TabsTrigger value="directory" className="gap-2">
            <Store className="size-4" /> Pharmacy Directory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grounded" className="space-y-6">
          <PharmacySearchGrounding />
        </TabsContent>

        <TabsContent value="directory" className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col gap-4 surface p-4 border border-border">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="pq">Search directory</Label>
                <Input
                  id="pq"
                  value={q}
                  maxLength={80}
                  placeholder="Name, area, pincode or service..."
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pradius">Radius</Label>
                <Select
                  value={radius.toString()}
                  onValueChange={(v) => setRadius(Number(v))}
                >
                  <SelectTrigger id="pradius">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 km</SelectItem>
                    <SelectItem value="2">2 km</SelectItem>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="psort">Sort by</Label>
                <Select
                  value={sort}
                  onValueChange={(v) => setSort(v as SortKey)}
                >
                  <SelectTrigger id="psort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Nearest first</SelectItem>
                    <SelectItem value="rating">Highest rated</SelectItem>
                    <SelectItem value="open">Open now first</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pb-2 h-10">
                <Switch
                  id="open"
                  checked={openOnly}
                  onCheckedChange={setOpenOnly}
                />
                <Label htmlFor="open">Open now only</Label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-medium"
                  onClick={handleUseLocation}
                  disabled={locationStatus === "loading"}
                >
                  <MapPin className="size-3.5" />
                  {locationStatus === "loading"
                    ? "Locating..."
                    : "Use my location"}
                </Button>
                <span className="text-xs text-muted-foreground hidden sm:inline-block">
                  Or drag the map to search a different area
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {list.length} results
              </p>
            </div>
          </div>

          {/* Unified Leaflet GIS Map & Pharmacy List View */}
          <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
            <LeafletPharmacyMap
              pharmacies={list}
              selectedPharmacyId={selectedPharmacyId}
              onSelectPharmacy={(p) => setSelectedPharmacyId(p.id)}
              userCoords={userLocation || undefined}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
