import { auth, defineMcp } from "@lovable.dev/mcp-js";

import comparePricesTool from "./tools/compare-prices";
import findPharmaciesTool from "./tools/find-pharmacies";
import getMedicineTool from "./tools/get-medicine";
import searchMedicinesTool from "./tools/search-medicines";

const projectRef =
  import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "medora-health-hub",
  title: "Medora Health Hub",
  version: "0.1.0",
  instructions:
    "Medicine intelligence tools for Medora. Use search_medicines to find products, get_medicine for composition, uses, side effects and warnings, compare_prices for local pharmacy pricing, and find_pharmacies for the pharmacy directory. All data is Medora demo catalogue data with provenance; it is informational only and never a substitute for professional medical advice.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchMedicinesTool,
    getMedicineTool,
    comparePricesTool,
    findPharmaciesTool,
  ] as never,
});
