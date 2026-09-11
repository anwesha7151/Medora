import fs from "fs";

const path = "src/routes/app.pharmacies.index.tsx";
let code = fs.readFileSync(path, "utf8");

// I will just completely rewrite PharmaciesPage to embed the new layout
const pageContent = `
function PharmaciesPage() {
  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("distance");
  const [radius, setRadius] = useState<number>(5);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"initial" | "loading" | "granted" | "denied">("initial");
  
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);

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
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
        toast.success("Location updated");
      },
      () => {
        setLocationStatus("denied");
        toast.error("Could not access your location. Using default center.");
      }
    );
  };

  const list = (data ?? [])
    .filter(
      (p) =>
        (!openOnly || isOpenNow(p)) &&
        \`\${p.name} \${p.address} \${p.city} \${p.services.join(" ")}\`
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
    <APIProvider
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
      onLoad={() => console.log("Maps API has loaded.")}
    >
      <div className="space-y-6">
        <PageHeader
          title="Pharmacies & Live Stock Grounding"
          demo
          description="Verify real-time stock availability, dispensary opening hours, and grounded regional pharmacy pricing before you travel."
        />
        
        <Tabs defaultValue="directory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grounded" className="gap-2">
              <Radio className="size-4 text-primary" /> Live Stock Grounding
              Tool
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
                      {locationStatus === "loading" ? "Locating..." : "Use my location"}
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

            {/* Unified Map & List View */}
            <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
              <GooglePharmacyMap 
                 pharmacies={list} 
                 selectedPharmacyId={selectedPharmacyId}
                 onSelectPharmacy={(p) => setSelectedPharmacyId(p.id)}
                 userCoords={userLocation || undefined}
              />
            </div>
            
          </TabsContent>
        </Tabs>
      </div>
    </APIProvider>
  );
}
`;

const startIndex = code.indexOf("function PharmaciesPage() {");
if (startIndex !== -1) {
  const newCode = code.slice(0, startIndex) + pageContent;
  fs.writeFileSync(path, newCode);
  console.log("Patched successfully!");
} else {
  console.log("Could not find function PharmaciesPage() {");
}
