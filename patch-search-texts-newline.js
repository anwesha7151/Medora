import fs from "fs";

const path = "src/routes/app.search.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  '{results.length} product{results.length > 1 ? "s" : ""} in the demo\\n            catalogue',
  '{results.length} product{results.length > 1 ? "s" : ""} in the catalogue',
);
content = content.replace(
  /} product\{results.length > 1 \? "s" : ""\} in the demo\s+catalogue/g,
  '} product{results.length > 1 ? "s" : ""} in the catalogue',
);

fs.writeFileSync(path, content);
