import fs from "fs";

const path = "src/routes/app.search.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  'description="Try the generic name or active ingredient instead of the brand, or clear the filters. The demo catalogue is intentionally small."',
  'description="Try the generic name or active ingredient instead of the brand, or clear the filters."',
);

content = content.replace(
  '{results.length} product{results.length > 1 ? "s" : ""} in the demo            catalogue',
  '{results.length} product{results.length > 1 ? "s" : ""} in the catalogue',
);

content = content.replace(
  '{results.length} product{results.length > 1 ? "s" : ""} in the demo catalogue',
  '{results.length} product{results.length > 1 ? "s" : ""} in the catalogue',
);

fs.writeFileSync(path, content);
