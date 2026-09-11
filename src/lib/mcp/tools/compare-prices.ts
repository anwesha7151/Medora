import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { demoMedicines, demoPharmacies, demoPrices } from "@/data/demo-catalog";

export default defineTool({
  name: "compare_prices",
  title: "Compare medicine prices",
  description:
    "Compare local pharmacy prices for a medicine, including equivalents with the same composition. Prices are demo data, not live retail prices.",
  inputSchema: {
    medicineId: z
      .string()
      .describe("Medicine id to price, e.g. med-para-500-tab-a."),
    includeEquivalents: z
      .boolean()
      .optional()
      .describe(
        "Also price other products with the same composition key. Defaults to true.",
      ),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: ({ medicineId, includeEquivalents = true }) => {
    const medicine = demoMedicines.find((m) => m.id === medicineId);
    if (!medicine)
      throw new ToolError(`No medicine found with id "${medicineId}".`);

    const ids = includeEquivalents
      ? demoMedicines
          .filter((m) => m.compositionKey === medicine.compositionKey)
          .map((m) => m.id)
      : [medicine.id];

    const listings = demoPrices
      .filter((p) => ids.includes(p.medicineId))
      .map((p) => {
        const pharmacy = demoPharmacies.find((ph) => ph.id === p.pharmacyId);
        const product = demoMedicines.find((m) => m.id === p.medicineId);
        return {
          medicineId: p.medicineId,
          brandName: product?.brandName ?? p.medicineId,
          pharmacy: pharmacy?.name ?? p.pharmacyId,
          distanceKm: pharmacy?.distanceKm ?? null,
          price: p.price,
          currency: p.currency,
          packSize: p.packSize,
          availability: p.availability,
          updatedAt: p.updatedAt,
        };
      })
      .sort((a, b) => a.price - b.price);

    const available = listings.filter((l) => l.availability !== "out_of_stock");
    const payload = {
      composition: medicine.compositionKey,
      lowest: available[0] ?? null,
      listings,
      disclaimer:
        "Demo price feed. Confirm availability and price with the pharmacy before travelling.",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
