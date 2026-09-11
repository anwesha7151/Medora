import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { ROLE_HOME, useAuth } from "@/lib/auth";
import { useSignOut } from "@/lib/use-sign-out";

/** Session-aware sign-in / workspace control for public pages. */
export function AuthHeaderAction({
  size = "sm",
}: {
  size?: "sm" | "default" | "lg";
}) {
  const { loading, isAuthenticated, primaryRole } = useAuth();
  const signOut = useSignOut();

  if (loading) {
    return (
      <Button size={size} variant="outline" disabled>
        Loading…
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button asChild size={size}>
        <Link to="/auth" search={{ next: "" }}>
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild size={size}>
        <Link to={ROLE_HOME[primaryRole ?? "patient"] as "/app"}>
          Open workspace
        </Link>
      </Button>
      <Button size={size} variant="ghost" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}
