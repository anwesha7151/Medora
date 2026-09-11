import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { demoMedicines } from "@/data/demo-catalog";

export default defineTool({
  name: "search_medicines",
  title: "Search medicines",
  description:
    "Search Medora's medicine catalogue by brand name, generic name or active ingredient. Returns demo catalogue data, never clinical advice.",
  inputSchema: {
    query: z
      .string()
      .describe("Brand, generic or ingredient text to search for."),
    prescriptionOnly: z
      .boolean()
      .optional()
      .describe(
        "Filter to prescription-only (true) or over-the-counter (false) products.",
      ),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: ({ query, prescriptionOnly }) => {
    const q = query.trim().toLowerCase();
    const results = demoMedicines
      .filter((m) =>
        prescriptionOnly === undefined
          ? true
          : m.prescriptionOnly === prescriptionOnly,
      )
      .filter(
        (m) =>
          !q ||
          m.brandName.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.activeIngredients.some((i) => i.name.toLowerCase().includes(q)),
      )
      .slice(0, 20)
      .map((m) => ({
        id: m.id,
        brandName: m.brandName,
        genericName: m.genericName,
        form: m.form,
        packSize: m.packSize,
        manufacturer: m.manufacturer,
        prescriptionOnly: m.prescriptionOnly,
        compositionKey: m.compositionKey,
        source: m.provenance.source,
      }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
