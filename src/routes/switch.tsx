import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, ShieldCheck, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, SafetyNotice } from "@/components/common/primitives";
import { AppRouteGroup } from "@/components/layout/AppRouteGroup";
import { useAuth } from "@/lib/auth";
import type { AppRole } from "@/lib/domain";

export const Route = createFileRoute("/switch")({
  head: () => ({
    meta: [
      { title: "Switch workspace — Medora" },
      {
        name: "description",
        content:
          "Move between the patient, pharmacy, doctor and admin workspaces in Medora.",
      },
      { property: "og:title", content: "Switch workspace — Medora" },
      {
        property: "og:description",
        content:
          "Patient, pharmacy, clinician and platform administration workspaces.",
      },
    ],
  }),
  component: SwitchRoute,
});

const workspaces: {
  role: AppRole;
  to: string;
  title: string;
  blurb: string;
  icon: typeof User;
}[] = [
  {
    role: "patient",
    to: "/app",
    title: "Patient",
    blurb:
      "Search medicines, compare verified listings, manage prescriptions and reminders.",
    icon: User,
  },
  {
    role: "pharmacy",
    to: "/pharmacy",
    title: "Pharmacy",
    blurb:
      "Inventory, expiry and low-stock alerts, prescription verification queue, orders.",
    icon: Building2,
  },
  {
    role: "doctor",
    to: "/doctor",
    title: "Clinician",
    blurb:
      "Patient list, consult workflow, assistive summaries and final clinical decisions.",
    icon: Stethoscope,
  },
  {
    role: "admin",
    to: "/admin",
    title: "Administrator",
    blurb:
      "Users, pharmacies, catalogue metadata, moderation, audit log and platform metrics.",
    icon: ShieldCheck,
  },
];

function SwitchRoute() {
  return (
    <AppRouteGroup>
      <SwitchWorkspace />
    </AppRouteGroup>
  );
}

function SwitchWorkspace() {
  const {
    isAuthenticated,
    hasAnyRole,
    loading,
    isDemoMode,
    signInWithDemoRole,
  } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-20">
        <Link to="/">
          <Logo />
        </Link>
        <h1 className="mt-8 text-3xl font-bold">Choose a workspace</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Medora ships four role-specific surfaces. Each one is gated by the
          role on your account: patient, pharmacy, clinician or administrator.
          Workspaces you don't hold are locked, and professional roles are
          granted after credential checks.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {workspaces.map((w) => (
            <button
              key={w.role}
              type="button"
              disabled={loading}
              onClick={async () => {
                if (isDemoMode) {
                  await signInWithDemoRole(w.role);
                  void navigate({ to: w.to as "/app" });
                  return;
                }
                if (!isAuthenticated) {
                  void navigate({ to: "/auth", search: { next: w.to } });
                  return;
                }
                void navigate({ to: w.to as "/app" });
              }}
              className="surface group flex flex-col items-start gap-3 p-5 text-left transition-shadow hover:shadow-soft focus-visible:shadow-soft"
            >
              <span className="grid size-9 place-items-center rounded-md bg-primary-soft text-primary">
                <w.icon className="size-4" aria-hidden />
              </span>
              <span className="font-display text-lg font-bold text-ink">
                {w.title}
              </span>
              <span className="text-sm text-muted-foreground">{w.blurb}</span>
              <span className="mt-1 text-sm font-semibold text-primary group-hover:underline">
                {isDemoMode
                  ? "Launch demo workspace →"
                  : !isAuthenticated
                    ? "Sign in to continue →"
                    : hasAnyRole([w.role, "admin"])
                      ? "Open workspace →"
                      : "Locked — role required"}
              </span>
            </button>
          ))}
        </div>

        <SafetyNotice
          title="Role separation is enforced in production"
          className="mt-8"
        >
          Professional workspaces require verified licence details and are
          audited. Clinical decisions, prescription verification and dispensing
          always stay with the qualified professional.
        </SafetyNotice>

        <div className="mt-8">
          <Button asChild variant="ghost">
            <Link to="/">Back to the landing page</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
