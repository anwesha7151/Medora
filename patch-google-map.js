import fs from "fs";

const path = "src/components/pharmacy/GooglePharmacyMap.tsx";
let code = fs.readFileSync(path, "utf8");

const newCode = `import { useState, useEffect, useRef } from "react";
import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
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
  Navigation2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import type { Pharmacy } from "@/lib/domain";
import { isOpenNow } from "@/services/medicines";

interface GooglePharmacyMapProps {
  pharmacies: Pharmacy[];
  selectedPharmacyId?: string | null;
  onSelectPharmacy?: (pharmacy: Pharmacy) => void;
  userCoords?: { lat: number; lng: number };
}

export function GooglePharmacyMap({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  userCoords = { lat: 12.9716, lng: 77.5946 }, // Default Bengaluru Central
}: GooglePharmacyMapProps) {
  const [activePharmacy, setActivePharmacy] = useState<Pharmacy | null>(
    pharmacies.find((p) => p.id === selectedPharmacyId) || null,
  );
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [zoomLevel, setZoomLevel] = useState<number>(13);
  
  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const map = useMap();

  useEffect(() => {
    if (selectedPharmacyId) {
      const match = pharmacies.find((p) => p.id === selectedPharmacyId);
      if (match) {
        setActivePharmacy(match);
        // Scroll list into view
        const el = itemRefs.current[match.id];
        if (el && listRef.current) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        // Pan map
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
    setDrawerOpen(true);
    
    // Pan map
    if (map) {
      map.panTo({ lat: pharmacy.coords.lat, lng: pharmacy.coords.lng });
      map.setZoom(15);
    }
  };

  const getDirectionsUrl = (p: Pharmacy) => {
    return \`https://www.google.com/maps/dir/?api=1&destination=\${p.coords.lat},\${p.coords.lng}\`;
  };

  // Center logic
  const centerLat = activePharmacy ? activePharmacy.coords.lat : userCoords.lat;
  const centerLng = activePharmacy ? activePharmacy.coords.lng : userCoords.lng;

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-border bg-card">
      {/* Map Control Bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Layers className="size-4 text-primary" />
          Interactive Map
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={mapType === "roadmap" ? "default" : "outline"}
            onClick={() => setMapType("roadmap")}
            className="h-8 text-xs"
          >
            Map
          </Button>
          <Button
            size="sm"
            variant={mapType === "satellite" ? "default" : "outline"}
            onClick={() => setMapType("satellite")}
            className="h-8 text-xs"
          >
            Satellite
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
            className="h-8 w-8 p-0"
            title="Zoom in"
          >
            +
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoomLevel((z) => Math.max(z - 1, 10))}
            className="h-8 w-8 p-0"
            title="Zoom out"
          >
            -
          </Button>
        </div>
      </div>

      {/* Main Map View & Overlay */}
      <div className="grid lg:grid-cols-[1fr_380px] divide-y lg:divide-y-0 lg:divide-x divide-border h-[600px]">
        {/* Interactive Map Iframe / Stage */}
        <div className="relative size-full bg-muted/20 min-h-[300px]">
          <Map
            mapId="DEMO_MAP_ID"
            center={{ lat: centerLat, lng: centerLng }}
            zoom={zoomLevel}
            onZoomChanged={(e) => setZoomLevel(e.detail.zoom)}
            mapTypeId={mapType}
            disableDefaultUI
            className="size-full"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          >
            {/* User Location Marker */}
            <AdvancedMarker
              position={userCoords}
              zIndex={40}
            >
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
                    className={\`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-all \${
                      isSelected
                        ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/30"
                        : "bg-background/95 text-foreground hover:bg-background backdrop-blur-sm border border-border"
                    }\`}
                  >
                    <span
                      className={\`size-2.5 rounded-full \${
                        open ? "bg-emerald-500" : "bg-zinc-400"
                      }\`}
                    />
                    <span className="max-w-[120px] truncate">
                      {p.name.split(" ")[0]}
                    </span>
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>

          {/* Quick info banner when pharmacy is selected - Hidden on mobile in favor of Drawer */}
          {activePharmacy && (
            <div className="absolute bottom-4 left-4 right-4 hidden lg:block rounded-xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur sm:left-auto sm:right-4 sm:max-w-sm transition-all animate-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate">
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
              
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Navigation2 className="size-3.5 text-primary" />{" "}
                  {activePharmacy.distanceKm} km
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {activePharmacy.open24h
                    ? "24 Hours"
                    : \`\${activePharmacy.opensAt} – \${activePharmacy.closesAt}\`}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 text-amber-500 fill-amber-500" />
                  {activePharmacy.rating} ({activePharmacy.reviews})
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    window.open(getDirectionsUrl(activePharmacy), "_blank")
                  }
                >
                  <Navigation className="mr-1.5 size-3.5" /> Directions
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  asChild
                >
                  <a href={\`tel:\${activePharmacy.phone}\`}>
                    <Phone className="mr-1 size-3.5" /> Call
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pharmacy Details Sidebar */}
        <div className="flex flex-col bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Directory Results
            </span>
            <Badge variant="secondary" className="text-[11px]">
              {pharmacies.length} nearby
            </Badge>
          </div>
          
          <div 
            ref={listRef}
            className="flex-1 overflow-y-auto p-2 space-y-2 scroll-smooth"
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
                  className={\`cursor-pointer rounded-xl border p-3 transition-all \${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }\`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {p.address}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {p.distanceKm} km
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span
                      className={\`inline-flex items-center gap-1.5 font-medium \${
                        open
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }\`}
                    >
                      <span className={\`size-2 rounded-full \${open ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}\`} />
                      {open ? "Open Now" : "Closed"}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Star className="size-3 text-amber-500" /> {p.rating}
                    </span>
                  </div>
                  
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2 text-xs -ml-2 hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getDirectionsUrl(p), "_blank");
                        }}
                      >
                        <Navigation className="size-3 mr-1.5" /> Directions
                      </Button>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
            
            {pharmacies.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                <Store className="size-8 mb-3 opacity-20" />
                No pharmacies found in this area. Try zooming out or clearing filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          {activePharmacy && (
            <div className="px-4 pb-8 pt-2">
              <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
              <DrawerHeader className="px-0 text-left">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DrawerTitle className="text-lg">{activePharmacy.name}</DrawerTitle>
                    <DrawerDescription className="mt-1">
                      {activePharmacy.address}, {activePharmacy.city}
                    </DrawerDescription>
                  </div>
                  <Badge variant={isOpenNow(activePharmacy) ? "default" : "secondary"}>
                    {isOpenNow(activePharmacy) ? "Open Now" : "Closed"}
                  </Badge>
                </div>
              </DrawerHeader>
              
              <div className="mt-2 grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4 border border-border/50">
                 <div>
                   <p className="text-xs text-muted-foreground mb-1">Distance</p>
                   <p className="font-semibold text-sm flex items-center gap-1.5">
                     <Navigation2 className="size-4 text-primary" /> {activePharmacy.distanceKm} km
                   </p>
                 </div>
                 <div>
                   <p className="text-xs text-muted-foreground mb-1">Hours</p>
                   <p className="font-semibold text-sm flex items-center gap-1.5">
                     <Clock className="size-4 text-primary" /> 
                     {activePharmacy.open24h ? "24 Hours" : \`\${activePharmacy.opensAt} - \${activePharmacy.closesAt}\`}
                   </p>
                 </div>
              </div>
              
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Available Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {activePharmacy.services.map(s => (
                    <Badge key={s} variant="outline" className="bg-background text-xs font-medium">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <DrawerFooter className="px-0 mt-6 pt-4 border-t border-border flex-row gap-2">
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => window.open(getDirectionsUrl(activePharmacy), "_blank")}
                >
                  <Navigation className="size-4" /> Get Directions
                </Button>
                <Button variant="outline" className="flex-1 gap-2" asChild>
                  <a href={\`tel:\${activePharmacy.phone}\`}>
                    <Phone className="size-4" /> Call Pharmacy
                  </a>
                </Button>
              </DrawerFooter>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
`;

fs.writeFileSync(path, newCode);
console.log("Patched GooglePharmacyMap.tsx successfully!");
