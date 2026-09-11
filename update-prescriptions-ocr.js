const fs = require("fs");

const path = "src/routes/app.prescriptions.tsx";
let code = fs.readFileSync(path, "utf8");

code = code.replace(
  /import \{ demoPrescriptions \} from "@\/data\/demo-catalog";/,
  `import { demoPrescriptions } from "@/data/demo-catalog";
import { ocrProvider } from "@/lib/ocr/provider";`,
);

code = code.replace(
  /function selectPrescriptionProfile[\s\S]*?demoPrescriptions\[0\]!;\n\}/m,
  "",
);

code = code.replace(
  /const template = selectPrescriptionProfile\(file.name, file.size\);\n      \n      const hydratedTemplate = \{/,
  `const ocrResult = await ocrProvider.extractPrescription(file);
      
      const hydratedTemplate = {
        ...ocrResult.prescription,`,
);

code = code.replace(
  /items: template.items.map\(\(i\) => \(\{/g,
  `items: ocrResult.items.map((i, index) => ({`,
);
code = code.replace(
  /id: \`\$\{i.id\}-\$\{Date.now\(\)\}\`,/g,
  `id: \`rx-item-\${Date.now()}-\${index}\`,`,
);

fs.writeFileSync(path, code);
