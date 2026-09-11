import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { demoMedicines } from "@/data/demo-catalog";

export default defineTool({
  name: "get_medicine",
  title: "Get medicine details",
  description:
    "Fetch full catalogue details for one medicine: composition, uses summary, side effects, warnings, storage and data provenance. Informational only, not medical advice.",
  inputSchema: {
    medicineId: z
      .string()
      .describe("Medicine id from search_medicines, e.g. med-para-500-tab-a."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: ({ medicineId }) => {
    const medicine = demoMedicines.find((m) => m.id === medicineId);
    if (!medicine)
      throw new ToolError(`No medicine found with id "${medicineId}".`);

    const equivalents = demoMedicines
      .filter(
        (m) =>
          m.compositionKey === medicine.compositionKey && m.id !== medicine.id,
      )
      .map((m) => ({
        id: m.id,
        brandName: m.brandName,
        manufacturer: m.manufacturer,
      }));

    const payload = {
      ...medicine,
      equivalents,
      disclaimer:
        "Demo catalogue data. Always confirm with a licensed pharmacist or clinician before acting.",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
