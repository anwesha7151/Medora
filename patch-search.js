import fs from "fs";

const path = "src/routes/app.search.tsx";
let content = fs.readFileSync(path, "utf8");

if (!content.includes("getProvider")) {
  content = content.replace(
    'import { searchMedicines } from "@/services/medicines";',
    'import { searchMedicines } from "@/services/medicines";\nimport { getProvider } from "@/services/medicine-provider";',
  );

  content = content.replace(
    '<DemoBadge label="Demo catalogue" />',
    '{getProvider().isLive ? <DemoBadge label="Live catalogue" /> : <DemoBadge label="Demo catalogue" />}',
  );

  fs.writeFileSync(path, content);
}
