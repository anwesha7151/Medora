const fs = require("fs");

const path = "src/components/pharmacy/GooglePharmacyMap.tsx";
let code = fs.readFileSync(path, "utf8");

console.log("File loaded.");
