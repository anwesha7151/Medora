import fs from "fs";

const path = "src/routes/app.pharmacies.index.tsx";
let code = fs.readFileSync(path, "utf8");

// I will insert a distance calculation
const distanceCalc = `
  // Calculate distance if we have user location, otherwise use demo distance
  const calculateDistance = (pLat: number, pLng: number) => {
    if (!userLocation) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (pLat - userLocation.lat) * (Math.PI / 180);
    const dLon = (pLng - userLocation.lng) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(pLat * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return Number((R * c).toFixed(1));
  };
`;

const listReplacement = `
  // Calculate distance if we have user location, otherwise use demo distance
  const calculateDistance = (pLat: number, pLng: number) => {
    if (!userLocation) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (pLat - userLocation.lat) * (Math.PI / 180);
    const dLon = (pLng - userLocation.lng) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(pLat * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return Number((R * c).toFixed(1));
  };

  const list = (data ?? [])
    .map(p => {
       const realDist = calculateDistance(p.coords.lat, p.coords.lng);
       return {
         ...p,
         distanceKm: realDist !== null ? realDist : p.distanceKm
       };
    })
    .filter(
      (p) =>
`;

code = code.replace("const list = (data ?? [])\n    .filter(", listReplacement);

fs.writeFileSync(path, code);
console.log("Patched distance calculation");
