import { createFileRoute } from "@tanstack/react-router";
import { MedicationScheduleAdherence } from "@/components/medication/MedicationScheduleAdherence";

export const Route = createFileRoute("/app/reminders")({
  head: () => ({
    meta: [
      { title: "Medication Schedule & Adherence Analytics — Medora" },
      {
        name: "description",
        content:
          "Input prescribed medicines, dosages, set automated reminders, and view interactive Recharts data visualizations of medication adherence and symptom progression over time.",
      },
      {
        property: "og:title",
        content: "Medication Schedule & Adherence Analytics — Medora",
      },
      {
        property: "og:description",
        content:
          "Medication schedule with reminders and adherence & symptom charts over time.",
      },
    ],
  }),
  component: RemindersPage,
});

function RemindersPage() {
  return <MedicationScheduleAdherence />;
}
