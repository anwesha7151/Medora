import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/primitives";
import { PatientHealthMetricsDashboard } from "@/components/patient/PatientHealthMetricsDashboard";

export const Route = createFileRoute("/doctor/patients")({
  head: () => ({
    meta: [
      {
        title:
          "Patient Health Metrics & Vitals Dashboard — Clinician Workspace | Medora",
      },
      {
        name: "description",
        content:
          "Monitor longitudinal patient vitals, blood pressure trends, glycemic control, weight trajectories, and cardiorespiratory metrics with Recharts.",
      },
    ],
  }),
  component: DoctorPatientDashboardPage,
});

function DoctorPatientDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Health Metrics & Longitudinal Trends"
        description="Comprehensive clinician telemetry for monitoring blood pressure trajectories, glycemic control, cardiorespiratory stability, and biomarker targets."
        demo
      />

      <PatientHealthMetricsDashboard />
    </div>
  );
}
