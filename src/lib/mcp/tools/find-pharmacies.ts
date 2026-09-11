import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { demoPharmacies } from "@/data/demo-catalog";

export default defineTool({
  name: "find_pharmacies",
  title: "Find pharmacies",
  description:
    "List Medora's demo pharmacy directory with distance, opening hours, services and licence identifiers.",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Optional name, city or service text to filter on."),
    open24hOnly: z
      .boolean()
      .optional()
      .describe("Only return pharmacies open 24 hours."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: ({ query, open24hOnly }) => {
    const q = (query ?? "").trim().toLowerCase();
    const results = demoPharmacies
      .filter((p) => (open24hOnly ? p.open24h : true))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.services.some((s) => s.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        distanceKm: p.distanceKm,
        rating: p.rating,
        hours: p.open24h ? "Open 24h" : `${p.opensAt} – ${p.closesAt}`,
        phone: p.phone,
        services: p.services,
        licenseId: p.licenseId,
      }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
