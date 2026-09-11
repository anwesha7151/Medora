import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Building2,
  Pill,
  ShieldAlert,
  Users,
} from "lucide-react";
import { PageHeader, StatTile } from "@/components/common/primitives";
import {
  ChartFrame,
  ChartLegend,
  MultiLineChart,
  SimpleBarChart,
} from "@/components/workspace/charts";
import {
  AsyncSection,
  StatusPill,
  WorkspaceSection,
} from "@/components/workspace/parts";
import { shortDate, useWorkspaceData } from "@/services/workspace";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Platform overview — Medora Admin workspace" },
      {
        name: "description",
        content:
          "Platform-wide KPIs, growth trends and the queue of items that need administrator attention.",
      },
      {
        property: "og:title",
        content: "Platform overview — Medora Admin workspace",
      },
      {
        property: "og:description",
        content:
          "Administrator overview of users, organisations, catalogue and moderation queues.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlatformOverviewPage,
});

function PlatformOverviewPage() {
  const users = useWorkspaceData("platformUsers");
  const orgs = useWorkspaceData("organisations");
  const catalogue = useWorkspaceData("catalogue");
  const moderation = useWorkspaceData("moderation");
  const metrics = useWorkspaceData("platformMetrics");

  const userRows = users.data ?? [];
  const orgRows = orgs.data ?? [];
  const catalogueRows = catalogue.data ?? [];
  const moderationRows = moderation.data ?? [];

  const roleCounts = userRows.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});
  const verifiedOrgs = orgRows.filter(
    (o) => o.verification === "verified",
  ).length;
  const openReports = moderationRows.filter(
    (r) => r.status === "open" || r.status === "investigating",
  ).length;
  const pendingUsers = userRows.filter((u) => u.status === "pending").length;
  const pendingOrgs = orgRows.filter(
    (o) => o.verification === "pending" || o.verification === "expired",
  );
  const needsReviewCatalogue = catalogueRows.filter(
    (c) => c.reviewState !== "published",
  );

  const roleBreakdown = Object.entries(roleCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        demo
        description="Aggregate figures computed from the loaded demo records — users, organisations, catalogue and moderation queues."
      />

      <AsyncSection
        query={users}
        emptyIcon={Users}
        emptyTitle="No users loaded"
        emptyDescription="Platform users will appear here once loaded."
        isEmpty={() => false}
      >
        {() => (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Total users"
              value={String(userRows.length)}
              icon={Users}
              hint={`${roleCounts["patient"] ?? 0} patients · ${roleCounts["doctor"] ?? 0} doctors · ${roleCounts["pharmacy"] ?? 0} pharmacies · ${roleCounts["admin"] ?? 0} admins`}
            />
            <StatTile
              label="Verified organisations"
              value={`${verifiedOrgs} / ${orgRows.length}`}
              icon={Building2}
              tone={pendingOrgs.length > 0 ? "attention" : "positive"}
              hint={`${pendingOrgs.length} pending or expired`}
            />
            <StatTile
              label="Catalogue size"
              value={String(catalogueRows.length)}
              icon={Pill}
              hint={`${needsReviewCatalogue.length} flagged for review`}
            />
            <StatTile
              label="Open moderation reports"
              value={String(openReports)}
              icon={ShieldAlert}
              tone={openReports > 0 ? "attention" : "default"}
              hint="Open or investigating"
            />
          </div>
        )}
      </AsyncSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <WorkspaceSection
          title="Growth trend"
          description="Patients, professionals and searches recorded by the platform metrics provider."
        >
          <AsyncSection
            query={metrics}
            emptyIcon={Activity}
            emptyTitle="No metrics recorded"
            emptyDescription="Platform metric points will appear here once available."
            isEmpty={(d) => d.length === 0}
          >
            {(data) => (
              <>
                <ChartFrame title="Users and searches over time" height={260}>
                  <MultiLineChart
                    data={data.map((d) => ({
                      date: shortDate(`${d.date}T00:00:00.000Z`),
                      Patients: d.patients,
                      Professionals: d.professionals,
                      Searches: d.searches,
                    }))}
                    xKey="date"
                    series={[
                      { key: "Patients", label: "Patients" },
                      { key: "Professionals", label: "Professionals" },
                      { key: "Searches", label: "Searches" },
                    ]}
                  />
                </ChartFrame>
                <ChartLegend
                  items={[
                    { label: "Patients", color: "var(--chart-1)" },
                    { label: "Professionals", color: "var(--chart-2)" },
                    { label: "Searches", color: "var(--chart-3)" },
                  ]}
                />
              </>
            )}
          </AsyncSection>
        </WorkspaceSection>

        <WorkspaceSection
          title="User role breakdown"
          description="Distribution of accounts by role, from the current user list."
        >
          <AsyncSection
            query={users}
            emptyIcon={Users}
            emptyTitle="No users loaded"
            emptyDescription="Role breakdown will appear once users are loaded."
            isEmpty={(d) => d.length === 0}
          >
            {() => (
              <ChartFrame title="Accounts by role" height={220}>
                <SimpleBarChart
                  data={roleBreakdown}
                  xKey="name"
                  yKey="value"
                  label="Accounts"
                />
              </ChartFrame>
            )}
          </AsyncSection>
        </WorkspaceSection>
      </div>

      <WorkspaceSection
        title="Needs administrator attention"
        description="A compact queue linking straight to the relevant workspace."
      >
        <ul className="divide-y divide-border">
          <li className="flex flex-wrap items-center gap-3 py-3">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            <span className="flex-1 text-sm">
              <span className="font-medium text-ink">{pendingUsers}</span> user
              account
              {pendingUsers === 1 ? "" : "s"} awaiting approval
            </span>
            <StatusPill
              label={pendingUsers > 0 ? "Action needed" : "Clear"}
              tone={pendingUsers > 0 ? "warning" : "positive"}
            />
            <Link
              to="/admin/users"
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              Review users
            </Link>
          </li>
          <li className="flex flex-wrap items-center gap-3 py-3">
            <Building2 className="size-4 text-warning" aria-hidden />
            <span className="flex-1 text-sm">
              <span className="font-medium text-ink">{pendingOrgs.length}</span>{" "}
              organisation
              {pendingOrgs.length === 1 ? "" : "s"} pending or with an expired
              licence
            </span>
            <StatusPill
              label={pendingOrgs.length > 0 ? "Action needed" : "Clear"}
              tone={pendingOrgs.length > 0 ? "warning" : "positive"}
            />
            <Link
              to="/admin/pharmacies"
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              Review organisations
            </Link>
          </li>
          <li className="flex flex-wrap items-center gap-3 py-3">
            <Pill className="size-4 text-warning" aria-hidden />
            <span className="flex-1 text-sm">
              <span className="font-medium text-ink">
                {needsReviewCatalogue.length}
              </span>{" "}
              catalogue record{needsReviewCatalogue.length === 1 ? "" : "s"}{" "}
              flagged for review
            </span>
            <StatusPill
              label={
                needsReviewCatalogue.length > 0 ? "Action needed" : "Clear"
              }
              tone={needsReviewCatalogue.length > 0 ? "warning" : "positive"}
            />
            <Link
              to="/admin/catalog"
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              Review catalogue
            </Link>
          </li>
          <li className="flex flex-wrap items-center gap-3 py-3">
            <ShieldAlert className="size-4 text-destructive" aria-hidden />
            <span className="flex-1 text-sm">
              <span className="font-medium text-ink">{openReports}</span> open
              moderation report
              {openReports === 1 ? "" : "s"}
            </span>
            <StatusPill
              label={openReports > 0 ? "Action needed" : "Clear"}
              tone={openReports > 0 ? "danger" : "positive"}
            />
            <span className="text-xs text-muted-foreground">
              See moderation log
            </span>
          </li>
        </ul>
      </WorkspaceSection>
    </div>
  );
}
