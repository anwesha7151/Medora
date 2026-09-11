import { createFileRoute } from "@tanstack/react-router";
import { DrugInteractionComparisonDashboard } from "@/components/clinical/DrugInteractionComparison";

export const Route = createFileRoute("/app/interactions")({
  head: () => ({
    meta: [
      { title: "Drug Interaction & Safety Comparison — Medora" },
      {
        name: "description",
        content:
          "Search medications, compare side effects, view safety alerts, contraindications, and duplicate active ingredients with deterministic pharmacology analysis.",
      },
      {
        property: "og:title",
        content: "Drug Interaction & Safety Comparison — Medora",
      },
      {
        property: "og:description",
        content:
          "Search medications, compare safety, side effects, and check drug interactions.",
      },
    ],
  }),
  component: InteractionsPage,
});

function InteractionsPage() {
  return <DrugInteractionComparisonDashboard />;
}
