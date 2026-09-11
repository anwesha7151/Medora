import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Compass,
  ExternalLink,
  Layers,
  MapPin,
  Navigation,
  Phone,
  RotateCcw,
  Star,
  Store,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Pharmacy } from "@/lib/domain";
import { isOpenNow } from "@/services/medicines";

interface LeafletPharmacyMapProps {
  pharmacies: Pharmacy[];
  selectedPharmacyId?: string | null | undefined;
  onSelectPharmacy?: ((pharmacy: Pharmacy) => void) | undefined;
  userCoords?: { lat: number; lng: number } | null | undefined;
}

const TILE_LAYERS = {
  voyager: {
    name: "Clean Street",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    name: "Dark Mode",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export function LeafletPharmacyMap({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  userCoords: rawUserCoords,
}: LeafletPharmacyMapProps) {
  const userCoords = rawUserCoords ?? { lat: 12.9716, lng: 77.5946 };
  const [activePharmacy, setActivePharmacy] = useState<Pharmacy | null>(
    pharmacies.find((p) => p.id === selectedPharmacyId) ||
      pharmacies[0] ||
      null,
  );
  const [currentLayer, setCurrentLayer] =
    useState<keyof typeof TILE_LAYERS>("voyager");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = [
      activePharmacy?.coords?.lat ?? userCoords.lat,
      activePharmacy?.coords?.lng ?? userCoords.lng,
    ];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
    });

    const tile = L.tileLayer(TILE_LAYERS[currentLayer].url, {
      attribution: TILE_LAYERS[currentLayer].attribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tile;
    mapInstanceRef.current = map;

    // Invalidate size after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update Tile Layer on Theme Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    const newTile = L.tileLayer(TILE_LAYERS[currentLayer].url, {
      attribution: TILE_LAYERS[currentLayer].attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [currentLayer]);

  // 3. Render / Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: "custom-user-marker",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(59, 130, 246, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-family: inherit; padding: 2px;">
          <b style="color: #2563eb; font-size: 12px;">📍 Your Location</b>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">GPS Reference Anchor</div>
        </div>`,
      );
  }, [userCoords]);

  // 4. Render / Update Pharmacy Node Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    pharmacies.forEach((p) => {
      const isSelected = activePharmacy?.id === p.id;
      const open = isOpenNow(p);
      const beaconColor = open ? "#10b981" : "#94a3b8";

      const pharmacyIcon = L.divIcon({
        className: `custom-pharmacy-node-${p.id}`,
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 5px 10px;
            border-radius: 9999px;
            background: ${isSelected ? "#0d9488" : "#ffffff"};
            color: ${isSelected ? "#ffffff" : "#0f172a"};
            border: ${isSelected ? "2px solid #0f766e" : "1.5px solid #cbd5e1"};
            box-shadow: 0 4px 12px rgba(0,0,0,0.18);
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
            transition: all 0.2s ease;
          ">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${beaconColor}; shrink: 0;"></span>
            <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis;">${p.name.split(" ")[0]}</span>
            <span style="font-size: 9px; opacity: 0.85;">${p.distanceKm}km</span>
          </div>
        `,
        iconSize: [120, 32],
        iconAnchor: [60, 16],
      });

      const marker = L.marker([p.coords.lat, p.coords.lng], {
        icon: pharmacyIcon,
        zIndexOffset: isSelected ? 500 : 100,
      })
        .addTo(map)
        .on("click", () => {
          handleSelect(p);
        });

      markersRef.current[p.id] = marker;
    });
  }, [pharmacies, activePharmacy]);

  // Handle Pharmacy Selection
  const handleSelect = (pharmacy: Pharmacy) => {
    setActivePharmacy(pharmacy);
    if (onSelectPharmacy) onSelectPharmacy(pharmacy);

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([pharmacy.coords.lat, pharmacy.coords.lng], 15, {
        animate: true,
        duration: 0.8,
      });
    }

    const el = itemRefs.current[pharmacy.id];
    if (el && listRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Sync when prop changes
  useEffect(() => {
    if (selectedPharmacyId) {
      const match = pharmacies.find((p) => p.id === selectedPharmacyId);
      if (match && match.id !== activePharmacy?.id) {
        handleSelect(match);
      }
    }
  }, [selectedPharmacyId]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetLocation = () => {
    mapInstanceRef.current?.flyTo([userCoords.lat, userCoords.lng], 13);
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <span className="flex size-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="font-display">Leaflet Live Medical Store GIS</span>
          <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
            OpenStreetMap Verified · {pharmacies.length} Nodes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer Style Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
            {(Object.keys(TILE_LAYERS) as (keyof typeof TILE_LAYERS)[]).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCurrentLayer(key)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    currentLayer === key
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {TILE_LAYERS[key].name}
                </button>
              ),
            )}
          </div>

          <div className="h-4 w-px bg-border mx-0.5" />

          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="size-7 p-0 rounded-lg text-xs"
            title="Zoom In"
          >
            <ZoomIn className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="size-7 p-0 rounded-lg text-xs"
            title="Zoom Out"
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetLocation}
            className="size-7 p-0 rounded-lg text-xs"
            title="Center on My Location"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Map Workspace: Leaflet Container + Pharmacy Node Sidebar */}
      <div className="grid lg:grid-cols-[1fr_380px] divide-y lg:divide-y-0 lg:divide-x divide-border h-[620px]">
        {/* Leaflet Map Stage */}
        <div className="relative size-full min-h-[300px]">
          <div ref={mapContainerRef} className="size-full z-0" />

          {/* Active Pharmacy Floating Action Card */}
          {activePharmacy && (
            <div className="absolute bottom-4 left-4 right-4 z-[500] hidden lg:block rounded-2xl border-2 border-primary/30 bg-background/95 p-4 shadow-2xl backdrop-blur sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Store className="size-4 text-primary shrink-0" />
                    <h4 className="text-sm font-bold text-foreground truncate font-display">
                      {activePharmacy.name}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {activePharmacy.address}, {activePharmacy.city}
                  </p>
                </div>
                <Badge
                  variant={isOpenNow(activePharmacy) ? "default" : "secondary"}
                  className="shrink-0 text-[10px]"
                >
                  {isOpenNow(activePharmacy) ? "Open Now" : "Closed"}
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                <div className="flex items-center gap-1 font-bold text-ink">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{activePharmacy.rating}</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    ({activePharmacy.reviews} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="rounded-xl h-7 text-xs font-bold gap-1"
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activePharmacy.coords.lat},${activePharmacy.coords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="size-3" /> Navigate
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Pharmacy Node List */}
        <div className="flex flex-col bg-card overflow-hidden">
          <div className="border-b border-border p-3.5 bg-muted/20 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Medical Stores & Chemists ({pharmacies.length})
            </h3>
            <span className="text-[10px] font-bold text-primary">
              Live GIS Grounding
            </span>
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto divide-y divide-border/60 p-2 space-y-1"
          >
            {pharmacies.map((p) => {
              const isSelected = activePharmacy?.id === p.id;
              const open = isOpenNow(p);

              return (
                <div
                  key={p.id}
                  ref={(el) => {
                    itemRefs.current[p.id] = el;
                  }}
                  onClick={() => handleSelect(p)}
                  className={`rounded-xl p-3 text-xs transition cursor-pointer ${
                    isSelected
                      ? "border-2 border-primary/50 bg-primary/5 shadow-xs"
                      : "hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`size-2 rounded-full shrink-0 ${
                          open ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                      />
                      <h4 className="font-display font-bold text-ink truncate">
                        {p.name}
                      </h4>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                        open
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {open ? "Open" : "Closed"}
                    </span>
                  </div>

                  <p className="text-muted-foreground truncate mt-0.5 text-[11px] pl-3.5">
                    {p.address}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40 pl-3.5">
                    <span className="font-semibold text-foreground">
                      {p.distanceKm} km away
                    </span>
                    <span className="flex items-center gap-1 font-bold text-ink">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {p.rating}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
