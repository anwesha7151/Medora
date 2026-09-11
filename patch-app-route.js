import fs from "fs";

const path = "src/routes/app.tsx";
let content = fs.readFileSync(path, "utf8");

if (!content.includes("ProviderStatusBanner")) {
  content = content.replace(
    'import { PatientShell } from "@/components/layout/PatientShell";',
    'import { PatientShell } from "@/components/layout/PatientShell";\nimport { ProviderStatusBanner } from "@/components/medicine/ProviderStatusBanner";',
  );

  content = content.replace(
    "<PatientShell>",
    "<PatientShell>\n          <ProviderStatusBanner />",
  );

  fs.writeFileSync(path, content);
}
