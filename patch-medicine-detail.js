import fs from "fs";

const path = "src/routes/app.medicine.$medicineId.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  'description="This product is not in the demo catalogue."',
  'description="This product is not in the catalogue."',
);

content = content.replace(
  'description="No pharmacy in the demo dataset lists this pack size right now."',
  'description="No pharmacy in the catalogue lists this pack size right now."',
);

content = content.replace(
  'title="No equivalents in the demo catalogue"',
  'title="No equivalents in the catalogue"',
);

fs.writeFileSync(path, content);
