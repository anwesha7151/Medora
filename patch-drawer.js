import fs from "fs";

const path = "src/components/pharmacy/GooglePharmacyMap.tsx";
let code = fs.readFileSync(path, "utf8");

code = code.replace(
  "setDrawerOpen(true);",
  "if (window.innerWidth < 1024) setDrawerOpen(true);",
);
// Wait, we also want to only render Drawer if we are on mobile, or Drawer handles it?
// Drawer usually shows from bottom. On desktop it can be weird.
// It's fine if we just prevent opening it.

fs.writeFileSync(path, code);
console.log("Patched Drawer logic");
