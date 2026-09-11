import { QueryClient } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PatientShell } from "@/components/layout/PatientShell";
import { useStore } from "@/lib/store";
import { Route as RootRoute } from "@/routes/__root";

function StoreProbe() {
  const { state } = useStore();
  return <div data-testid="probe">role:{state.role}</div>;
}

function buildRouter() {
  const appRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/app",
    component: () => (
      <PatientShell>
        <StoreProbe />
      </PatientShell>
    ),
  });

  return createRouter({
    routeTree: RootRoute.addChildren([appRoute]),
    context: { queryClient: new QueryClient() },
    history: createMemoryHistory({ initialEntries: ["/app"] }),
  });
}

describe("root route store wiring", () => {
  it("renders PatientShell under the root provider without useStore errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<RouterProvider router={buildRouter()} />);

    await waitFor(() =>
      expect(screen.getByTestId("probe")).toBeInTheDocument(),
    );

    // The shell itself consumes the store (notifications, cart) and rendered fine.
    expect(screen.getAllByRole("navigation").length).toBeGreaterThan(0);

    const providerErrors = errorSpy.mock.calls
      .flat()
      .map((c) => (c instanceof Error ? c.message : String(c)))
      .filter((m) => m.includes("useStore must be used inside"));
    expect(providerErrors).toEqual([]);

    errorSpy.mockRestore();
  }, 15000);

  it("throws a clear error when useStore is used without the provider", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<StoreProbe />)).toThrow(
      /useStore must be used inside/,
    );
    errorSpy.mockRestore();
  });
});
