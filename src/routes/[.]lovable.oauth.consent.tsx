import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type OAuthResult = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string; client_uri?: string; redirect_uri?: string };
  scope?: string;
};

const oauthApi = () =>
  (
    supabase.auth as unknown as {
      oauth: {
        getAuthorizationDetails: (id: string) => Promise<{
          data: OAuthResult | null;
          error: { message: string } | null;
        }>;
        approveAuthorization: (id: string) => Promise<{
          data: OAuthResult | null;
          error: { message: string } | null;
        }>;
        denyAuthorization: (id: string) => Promise<{
          data: OAuthResult | null;
          error: { message: string } | null;
        }>;
      };
    }
  ).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id:
      typeof search["authorization_id"] === "string"
        ? search["authorization_id"]
        : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: { next: location.pathname + location.searchStr },
      });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.searchStr).get(
      "authorization_id",
    )!;
    const { data, error } =
      await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-6 py-16 text-sm text-muted-foreground">
      Could not load this authorization request:{" "}
      {String((error as Error)?.message ?? error)}
    </main>
  ),
  component: Consent,
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "this client";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect {clientName} to Medora</CardTitle>
          <CardDescription>
            This lets {clientName} use Medora's medicine intelligence tools as
            you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ul className="space-y-2 text-muted-foreground">
            <li>Search the medicine catalogue and read product details</li>
            <li>
              Compare local pharmacy prices and browse the pharmacy directory
            </li>
            {details?.client?.redirect_uri ? (
              <li>Redirects to {details.client.redirect_uri}</li>
            ) : null}
            {details?.scope ? <li>Requested scope: {details.scope}</li> : null}
          </ul>
          <p className="text-xs text-muted-foreground">
            This does not bypass Medora's permissions or backend policies. Tool
            responses are informational demo data and never medical advice.
          </p>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              disabled={busy}
              onClick={() => decide(true)}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => decide(false)}
              className="flex-1"
            >
              Cancel connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
