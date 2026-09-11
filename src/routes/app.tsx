import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppRouteGroup } from "@/components/layout/AppRouteGroup";
import { RequireRole } from "@/components/auth/RequireRole";
import { PatientShell } from "@/components/layout/PatientShell";
import { ProviderStatusBanner } from "@/components/medicine/ProviderStatusBanner";

export const Route = createFileRoute("/app")({
  component: PatientLayout,
});

function PatientLayout() {
  return (
    <AppRouteGroup>
      <RequireRole allow={["patient", "pharmacy", "doctor", "admin"]}>
        <PatientShell>
          <ProviderStatusBanner />
          <Outlet />
        </PatientShell>
      </RequireRole>
    </AppRouteGroup>
  );
}
