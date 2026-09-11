import type { ReactNode } from "react";

import { AppErrorBoundary } from "@/components/common/AppErrorBoundary";
import { AppStoreProvider, useOptionalStore } from "@/lib/store";

/**
 * Mounts <AppStoreProvider> only if one isn't already above in the tree, so
 * nesting is always safe (the root already provides it; this is the guarantee
 * for any route group mounted outside the root provider).
 */
function EnsureStoreProvider({ children }: { children: ReactNode }) {
  const existing = useOptionalStore();
  if (existing) return <>{children}</>;
  return <AppStoreProvider>{children}</AppStoreProvider>;
}

/**
 * Shared wrapper for every app route group (patient /app, /switch and the
 * pharmacy, doctor and admin workspaces, plus all their nested routes).
 * Guarantees store access and a safe fallback screen for the whole subtree.
 */
export function AppRouteGroup({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <EnsureStoreProvider>{children}</EnsureStoreProvider>
    </AppErrorBoundary>
  );
}
