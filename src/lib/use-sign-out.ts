import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

/** Signs the account out, tears down cached data and returns to the sign-in page. */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const auth = useAuth();
  const { signOut: clearLocalSession } = useStore();

  return useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    clearLocalSession();
    await auth.signOut();
    await navigate({ to: "/auth", search: { next: "" }, replace: true });
  }, [queryClient, clearLocalSession, auth, navigate]);
}
