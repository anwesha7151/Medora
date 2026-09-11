import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppRouteGroup } from "@/components/layout/AppRouteGroup";
import { RequireRole } from "@/components/auth/RequireRole";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { pharmacyNav } from "@/components/layout/nav-config";

export const Route = createFileRoute("/pharmacy")({
  component: PharmacyLayout,
});

function PharmacyLayout() {
  return (
    <AppRouteGroup>
      <RequireRole allow={["pharmacy", "admin"]}>
        <WorkspaceShell workspace="Pharmacy" items={pharmacyNav}>
          <Outlet />
        </WorkspaceShell>
      </RequireRole>
    </AppRouteGroup>
  );
}
