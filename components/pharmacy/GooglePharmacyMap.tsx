import { useState, useEffect, useRef, useMemo } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ExternalLink,
  Layers,
  Sparkles,
  CheckCircle2,
  Store,
  ChevronRight,
  Navigation2,
  Star,
  Key,
  ShieldCheck,
  Compass,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import type { Pharmacy } from "@/lib/domain";
import { isOpenNow } from "@/services/medicines";
import { toast } from "sonner";

export const GOOGLE_MAPS_KEY_STORAGE = "medora_google_maps_api_key";

export function getStoredGoogleMapsKey(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(GOOGLE_MAPS_KEY_STORAGE);
    if (stored && stored.trim()) return stored.trim();
  }
  const viteKey =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] as string)
      : undefined;
  return viteKey || "";
}

export function isGoogleMapsKeyValid(key?: string): boolean {
  if (!key) return false;
  const k = key.trim();
  return (
    k.length > 20 &&
    !k.includes("YOUR_") &&
    !k.includes("DEMO") &&
    !k.includes("undefined")
  );
}

interface GooglePharmacyMapProps {
  pharmacies: Pharmacy[];
  selectedPharmacyId?: string | null | undefined;
  onSelectPharmacy?: ((pharmacy: Pharmacy) => void) | undefined;
  userCoords?: { lat: number; lng: number } | undefined;
}

export function GooglePharmacyMap({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  userCoords = { lat: 19.076, lng: 72.8777 }, // Default Mumbai / Metro
}: GooglePharmacyMapProps) {
  const [apiKey, setApiKey] = useState<string>(getStoredGoogleMapsKey());
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);

  const hasRealGoogleMapsKey = isGoogleMapsKeyValid(apiKey);

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    if (typeof window !== "undefined") {
      if (trimmed) {
        window.localStorage.setItem(GOOGLE_MAPS_KEY_STORAGE, trimmed);
        setApiKey(trimmed);
        toast.success("Google Maps API Key saved! Loading live map.");
      } else {
        window.localStorage.removeItem(GOOGLE_MAPS_KEY_STORAGE);
        setApiKey("");
        toast.info("Using Interactive Demo Map.");
      }
    }
    setKeyModalOpen(false);
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
      {/* Key Config Modal */}
      <Dialog open={keyModalOpen} onOpenChange={setKeyModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-extrabold text-ink flex items-center gap-2">
              <Key className="size-5 text-primary" /> Google Maps API Key
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter your Google Maps JavaScript API key to enable live satellite
              and terrain imagery. Leave empty to use the built-in Interactive
              Vector Map.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                API Key (VITE_GOOGLE_MAPS_API_KEY)
              </Label>
              <Input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="font-mono text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setKeyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveKey} className="font-bold">
                Save & Reload Map
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {hasRealGoogleMapsKey ? (
        <APIProvider apiKey={apiKey}>
          <LiveGoogleMapInner
            pharmacies={pharmacies}
            selectedPharmacyId={selectedPharmacyId}
            onSelectPharmacy={onSelectPharmacy}
            userCoords={userCoords}
            onOpenKeyModal={() => {
              setKeyInput(apiKey);
              setKeyModalOpen(true);
            }}
          />
        </APIProvider>
      ) : (
        <InteractiveDemoVectorMap
          pharmacies={pharmacies}
          selectedPharmacyId={selectedPharmacyId}
          onSelectPharmacy={onSelectPharmacy}
          userCoords={userCoords}
          onOpenKeyModal={() => {
            setKeyInput(apiKey);
            setKeyModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// 1. HIGH-END INTERACTIVE VECTOR DEMO MAP (NO API KEY REQUIRED)
// ----------------------------------------------------------------------------

function InteractiveDemoVectorMap({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  userCoords = { lat: 19.076, lng: 72.8777 },
  onOpenKeyModal,
}: GooglePharmacyMapProps & { onOpenKeyModal: () => void }) {
  const [activePharmacy, setActivePharmacy] = useState<Pharmacy | null>(
    pharmacies.find((p) => p.id === selectedPharmacyId) ||
      pharmacies[0] ||
      null,
  );
  const [mapTheme, setMapTheme] = useState<"light" | "dark" | "blueprint">(
    "light",
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedPharmacyId) {
      const match = pharmacies.find((p) => p.id === selectedPharmacyId);
      if (match) {
        setActivePharmacy(match);
        const el = itemRefs.current[match.id];
        if (el && listRef.current) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    }
  }, [selectedPharmacyId, pharmacies]);

  const handleSelect = (pharmacy: Pharmacy) => {
    setActivePharmacy(pharmacy);
    if (onSelectPharmacy) onSelectPharmacy(pharmacy);
    if (window.innerWidth < 1024) setDrawerOpen(true);
  };

  // Compute bounding box and relative percentage positions
  const bounds = useMemo(() => {
    const lats = [userCoords.lat, ...pharmacies.map((p) => p.coords.lat)];
    const lngs = [userCoords.lng, ...pharmacies.map((p) => p.coords.lng)];
    const minLat = Math.min(...lats) - 0.015;
    const maxLat = Math.max(...lats) + 0.015;
    const minLng = Math.min(...lngs) - 0.02;
    const maxLng = Math.max(...lngs) + 0.02;
    return { minLat, maxLat, minLng, maxLng };
  }, [pharmacies, userCoords]);

  const projectToMap = (lat: number, lng: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 0.04;
    const lngSpan = bounds.maxLng - bounds.minLng || 0.05;
    const x = ((lng - bounds.minLng) / lngSpan) * 100;
    const y = ((bounds.maxLat - lat) / latSpan) * 100;
    return {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    };
  };

  const userPos = projectToMap(userCoords.lat, userCoords.lng);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-display">Interactive Vector Grounding Map</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            Demo Mode
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Style Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setMapTheme("light")}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                mapTheme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Streets
            </button>
            <button
              type="button"
              onClick={() => setMapTheme("blueprint")}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                mapTheme === "blueprint"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Blueprint
            </button>
            <button
              type="button"
              onClick={() => setMapTheme("dark")}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                mapTheme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Night
            </button>
          </div>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Zoom Controls */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            className="size-7 p-0 rounded-lg text-xs"
            title="Zoom in"
          >
            +
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
            className="size-7 p-0 rounded-lg text-xs"
            title="Zoom out"
          >
            -
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetView}
            className="size-7 p-0 rounded-lg text-xs"
            title="Reset View"
          >
            <RotateCcw className="size-3" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenKeyModal}
            className="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1 text-primary border-primary/30 hover:bg-primary/5"
          >
            <Key className="size-3" /> Connect Google API Key
          </Button>
        </div>
      </div>

      {/* Main Map Workspace: Interactive Vector Grid + Sidebar List */}
      <div className="grid lg:grid-cols-[1fr_380px] divide-y lg:divide-y-0 lg:divide-x divide-border h-[620px]">
        {/* Canvas / Vector Map Viewport */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative size-full overflow-hidden select-none cursor-grab active:cursor-grabbing ${
            mapTheme === "light"
              ? "bg-[#e5e9ec]"
              : mapTheme === "blueprint"
                ? "bg-[#0b192c]"
                : "bg-[#181a1b]"
          }`}
        >
          {/* Animated Background SVG Topography & Roads */}
          <div
            className="absolute inset-0 origin-center transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <svg
              className="size-full"
              viewBox="0 0 1000 700"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="grid-pattern"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke={mapTheme === "light" ? "#d5dbe0" : "#1e293b"}
                    strokeWidth="1"
                  />
                </pattern>
                {/* Radial Glow */}
                <radialGradient id="user-pulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid Background */}
              <rect width="1000" height="700" fill="url(#grid-pattern)" />

              {/* Water Body Simulation */}
              <path
                d="M 0,220 C 180,240 320,180 500,210 C 700,240 850,190 1000,230 L 1000,320 C 800,280 620,330 450,300 C 280,270 120,310 0,300 Z"
                fill={
                  mapTheme === "light"
                    ? "#bfdbfe"
                    : mapTheme === "blueprint"
                      ? "#1e3a8a"
                      : "#1e293b"
                }
                opacity="0.6"
              />

              {/* Parks / Green Zones */}
              <rect
                x="80"
                y="80"
                width="180"
                height="120"
                rx="20"
                fill={mapTheme === "light" ? "#dcfce7" : "#064e3b"}
                opacity="0.6"
              />
              <rect
                x="720"
                y="380"
                width="220"
                height="160"
                rx="30"
                fill={mapTheme === "light" ? "#dcfce7" : "#064e3b"}
                opacity="0.6"
              />

              {/* Highways & Arterial Roads */}
              <path
                d="M 0,150 Q 400,120 1000,180"
                fill="none"
                stroke={mapTheme === "light" ? "#fef08a" : "#ca8a04"}
                strokeWidth="14"
                opacity="0.8"
              />
              <path
                d="M 280,0 Q 320,350 290,700"
                fill="none"
                stroke={mapTheme === "light" ? "#ffffff" : "#475569"}
                strokeWidth="12"
              />
              <path
                d="M 680,0 Q 640,320 700,700"
                fill="none"
                stroke={mapTheme === "light" ? "#ffffff" : "#475569"}
                strokeWidth="12"
              />
              <path
                d="M 0,480 Q 500,420 1000,520"
                fill="none"
                stroke={mapTheme === "light" ? "#ffffff" : "#475569"}
                strokeWidth="10"
              />
              <path
                d="M 120,0 L 880,700"
                fill="none"
                stroke={mapTheme === "light" ? "#cbd5e1" : "#334155"}
                strokeWidth="6"
                strokeDasharray="8,8"
              />
            </svg>

            {/* User Location Radar Marker */}
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute size-14 rounded-full bg-blue-500/20 animate-ping" />
                <span className="absolute size-8 rounded-full bg-blue-500/30 animate-pulse" />
                <div className="relative grid size-5 place-items-center rounded-full bg-blue-600 text-white border-2 border-white shadow-md">
                  <Compass className="size-3 animate-spin" />
                </div>
              </div>
              <span className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white whitespace-nowrap shadow-sm">
                You (Current Location)
              </span>
            </div>

            {/* Interactive Pharmacy Pins */}
            {pharmacies.map((p) => {
              const pos = projectToMap(p.coords.lat, p.coords.lng);
              const isSelected = activePharmacy?.id === p.id;
              const open = isOpenNow(p);

              return (
                <div
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(p);
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    zIndex: isSelected ? 40 : 10,
                  }}
                >
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground scale-125 ring-4 ring-primary/30"
                        : "bg-card text-foreground hover:scale-110 border border-border/80 backdrop-blur-md"
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full shrink-0 ${
                        open ? "bg-emerald-500" : "bg-zinc-400"
                      }`}
                    />
                    <span className="truncate max-w-[110px] font-display">
                      {p.name.split(" ")[0]}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {p.distanceKm}km
                    </span>
                  </div>

                  {/* Pin Pointer Arrow */}
                  <div
                    className={`mx-auto size-2 -mt-0.5 rotate-45 transform ${
                      isSelected
                        ? "bg-primary"
                        : "bg-card border-r border-b border-border/80"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Quick Floating Banner when a Pharmacy is Selected */}
          {activePharmacy && (
            <div className="absolute bottom-4 left-4 right-4 hidden lg:block rounded-2xl border-2 border-primary/20 bg-background/95 p-4 shadow-2xl backdrop-blur sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate font-display">
                    {activePharmacy.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {activePharmacy.address}, {activePharmacy.city}
                  </p>
                </div>
                <Badge
                  variant={isOpenNow(activePharmacy) ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {isOpenNow(activePharmacy) ? "Open Now" : "Closed"}
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{activePharmacy.rating}</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    ({activePharmacy.reviews})
                  </span>
                </div>
                <Button
                  size="sm"
                  asChild
                  className="rounded-xl h-7 text-xs font-bold gap-1"
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activePharmacy.coords.lat},${activePharmacy.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="size-3" /> Directions
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Pharmacy List */}
        <div className="flex flex-col bg-card overflow-hidden">
          <div className="border-b border-border p-3.5 bg-muted/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pharmacies Nearby ({pharmacies.length})
            </h3>
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
                      ? "border-2 border-primary/40 bg-primary/5 shadow-xs"
                      : "hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display font-bold text-ink truncate">
                      {p.name}
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                        open
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {open ? "Open Now" : "Closed"}
                    </span>
                  </div>

                  <p className="text-muted-foreground truncate mt-0.5">
                    {p.address}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
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

// ----------------------------------------------------------------------------
// 2. LIVE GOOGLE MAPS INNER (USED WHEN REAL API KEY IS PRESENT)
// ----------------------------------------------------------------------------

function LiveGoogleMapInner({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  userCoords = { lat: 19.076, lng: 72.8777 },
  onOpenKeyModal,
}: GooglePharmacyMapProps & { onOpenKeyModal: () => void }) {
  const [activePharmacy, setActivePharmacy] = useState<Pharmacy | null>(
    pharmacies.find((p) => p.id === selectedPharmacyId) || null,
  );
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [zoomLevel, setZoomLevel] = useState<number>(13);
  const map = useMap();

  useEffect(() => {
    if (selectedPharmacyId) {
      const match = pharmacies.find((p) => p.id === selectedPharmacyId);
      if (match) {
        setActivePharmacy(match);
        if (map) {
          map.panTo({ lat: match.coords.lat, lng: match.coords.lng });
          map.setZoom(15);
        }
      }
    }
  }, [selectedPharmacyId, pharmacies, map]);

  const handleSelect = (pharmacy: Pharmacy) => {
    setActivePharmacy(pharmacy);
    if (onSelectPharmacy) onSelectPharmacy(pharmacy);
    if (map) {
      map.panTo({ lat: pharmacy.coords.lat, lng: pharmacy.coords.lng });
      map.setZoom(15);
    }
  };

  const centerLat = activePharmacy?.coords?.lat ?? userCoords?.lat ?? 19.076;
  const centerLng = activePharmacy?.coords?.lng ?? userCoords?.lng ?? 72.8777;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Layers className="size-4 text-primary" />
          <span>Live Google Satellite & Map</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={mapType === "roadmap" ? "default" : "outline"}
            onClick={() => setMapType("roadmap")}
            className="h-7 text-xs"
          >
            Map
          </Button>
          <Button
            size="sm"
            variant={mapType === "satellite" ? "default" : "outline"}
            onClick={() => setMapType("satellite")}
            className="h-7 text-xs"
          >
            Satellite
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenKeyModal}
            className="h-7 px-2 text-xs"
          >
            API Key
          </Button>
        </div>
      </div>

      <div className="relative size-full min-h-[600px] bg-muted/20">
        <Map
          mapId="MEDORA_LIVE_MAP"
          center={{ lat: centerLat, lng: centerLng }}
          zoom={zoomLevel}
          onZoomChanged={(e) => setZoomLevel(e.detail.zoom)}
          mapTypeId={mapType}
          disableDefaultUI
          className="size-full min-h-[600px]"
        >
          <AdvancedMarker position={userCoords} zIndex={40}>
            <div className="relative flex items-center justify-center">
              <div className="absolute size-8 rounded-full bg-primary/20 animate-ping" />
              <div className="relative size-4 rounded-full border-2 border-background bg-primary shadow-sm" />
            </div>
          </AdvancedMarker>

          {pharmacies.map((p) => {
            const isSelected = activePharmacy?.id === p.id;
            const open = isOpenNow(p);
            return (
              <AdvancedMarker
                key={p.id}
                position={{ lat: p.coords.lat, lng: p.coords.lng }}
                onClick={() => handleSelect(p)}
                zIndex={isSelected ? 50 : 10}
              >
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/30"
                      : "bg-background/95 text-foreground hover:bg-background backdrop-blur-sm border border-border"
                  }`}
                >
                  <span
                    className={`size-2.5 rounded-full ${open ? "bg-emerald-500" : "bg-zinc-400"}`}
                  />
                  <span className="max-w-[120px] truncate">
                    {p.name.split(" ")[0]}
                  </span>
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>
      </div>
    </div>
  );
}
