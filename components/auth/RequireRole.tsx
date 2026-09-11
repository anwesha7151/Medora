import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ROLE_HOME, useAuth, type AccountRole } from "@/lib/auth";

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );
}

/**
 * Client-side guard for a whole route group. Redirects signed-out visitors to
 * /auth (remembering where they were going) and blocks signed-in users who
 * don't hold one of the allowed roles.
 */
export function RequireRole({
  allow,
  children,
}: {
  allow: AccountRole[];
  children: ReactNode;
}) {
  const { loading, isAuthenticated, hasAnyRole, primaryRole } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.href });
  const target = useRef(pathname);
  const redirected = useRef(false);

  useEffect(() => {
    if (loading || isAuthenticated || redirected.current) return;
    redirected.current = true;
    const next = target.current.startsWith("/auth") ? "" : target.current;
    void navigate({ to: "/auth", search: { next }, replace: true });
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <FullScreen>
        <Loader2
          className="mx-auto size-6 animate-spin text-primary"
          aria-hidden
        />
        <p className="mt-3 text-sm text-muted-foreground">
          Checking your session…
        </p>
      </FullScreen>
    );
  }

  if (!isAuthenticated) {
    return (
      <FullScreen>
        <p className="text-sm text-muted-foreground">
          Redirecting you to sign in…
        </p>
      </FullScreen>
    );
  }

  if (!hasAnyRole(allow)) {
    return (
      <FullScreen>
        <span className="mx-auto grid size-11 place-items-center rounded-md bg-destructive/10 text-destructive">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold">
          This workspace needs a different role
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is signed in as{" "}
          <span className="font-medium text-foreground">
            {primaryRole ?? "no role assigned"}
          </span>
          . Professional workspaces are granted after licence verification by a
          Medora administrator.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {primaryRole ? (
            <Button asChild>
              <Link to={ROLE_HOME[primaryRole] as "/app"}>
                Go to {primaryRole} workspace
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/switch">Switch role</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </FullScreen>
    );
  }

  return <>{children}</>;
}
