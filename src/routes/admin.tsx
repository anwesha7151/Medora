import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppRouteGroup } from "@/components/layout/AppRouteGroup";
import { RequireRole } from "@/components/auth/RequireRole";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { adminNav } from "@/components/layout/nav-config";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AppRouteGroup>
      <RequireRole allow={["admin"]}>
        <WorkspaceShell workspace="Admin" items={adminNav}>
          <Outlet />
        </WorkspaceShell>
      </RequireRole>
    </AppRouteGroup>
  );
}
