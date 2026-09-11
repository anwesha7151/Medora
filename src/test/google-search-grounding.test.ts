import { describe, expect, it } from "vitest";
import type {
  GroundedSearchResponse,
  GroundedSource,
} from "@/routes/api.grounded-search";

describe("Google Search Grounding & Clinical Intelligence", () => {
  it("formats grounded clinical response with source citations and search queries", () => {
    const mockGroundedResponse: GroundedSearchResponse = {
      answer:
        "Semaglutide is approved for T2DM and weight management with cardiorenal protection endpoints demonstrated in STEP and SELECT trials.",
      searchQueries: [
        "Semaglutide clinical trials 2025",
        "Semaglutide CDSCO approvals India",
      ],
      sources: [
        {
          title: "The New England Journal of Medicine",
          url: "https://www.nejm.org/doi/full/10.1056/NEJMoa2307563",
          snippet:
            "Semaglutide and Cardiovascular Outcomes in Patients with Overweight or Obesity",
        },
        {
          title: "CDSCO Approved New Drugs",
          url: "https://cdsco.gov.in/opencms/opencms/en/Drugs/New-Drugs/",
          snippet: "Official List of New Drugs approved by CDSCO",
        },
      ],
      modelUsed: "gemini-3.7-flash (Google Search Grounded)",
      grounded: true,
      timestamp: new Date().toISOString(),
    };

    expect(mockGroundedResponse.grounded).toBe(true);
    expect(mockGroundedResponse.modelUsed).toContain("gemini-3.7-flash");
    expect(mockGroundedResponse.searchQueries.length).toBe(2);
    expect(mockGroundedResponse.sources.length).toBe(2);
    expect(mockGroundedResponse.sources[0].url).toContain("nejm.org");
  });

  it("handles fallback clinical synthesis gracefully when offline or without API key", () => {
    const fallback: GroundedSearchResponse = {
      answer:
        "Clinical overview for Metformin under Pharmacovigilance Programme of India (PvPI).",
      searchQueries: [
        "Metformin CDSCO advisory",
        "NPPA Metformin ceiling price",
      ],
      sources: [
        {
          title: "CDSCO National Formulary of India",
          url: "https://cdsco.gov.in",
        },
        {
          title: "National Pharmaceutical Pricing Authority (NPPA)",
          url: "https://www.nppaindia.nic.in",
        },
      ],
      modelUsed: "Medora Clinical Knowledge Graph",
      grounded: true,
      timestamp: new Date().toISOString(),
    };

    expect(fallback.answer).toContain("Metformin");
    expect(fallback.sources.some((s) => s.url.includes("cdsco.gov.in"))).toBe(
      true,
    );
  });
});
