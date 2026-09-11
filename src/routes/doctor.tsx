import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppRouteGroup } from "@/components/layout/AppRouteGroup";
import { RequireRole } from "@/components/auth/RequireRole";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { doctorNav } from "@/components/layout/nav-config";

export const Route = createFileRoute("/doctor")({
  component: DoctorLayout,
});

function DoctorLayout() {
  return (
    <AppRouteGroup>
      <RequireRole allow={["doctor", "admin"]}>
        <WorkspaceShell workspace="Clinician" items={doctorNav}>
          <Outlet />
        </WorkspaceShell>
      </RequireRole>
    </AppRouteGroup>
  );
}
