import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Pill } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import {
  AsyncSection,
  StatusPill,
  WorkspaceSection,
} from "@/components/workspace/parts";
import { daysUntil, shortDate, useWorkspaceData } from "@/services/workspace";
import type { CatalogueRecord } from "@/data/workspace-demo";

export const Route = createFileRoute("/admin/catalog")({
  head: () => ({
    meta: [
      { title: "Catalogue — Medora Admin workspace" },
      {
        name: "description",
        content:
          "Review catalogue entries, their provenance and last-reviewed date, with stale or incomplete records flagged for review.",
      },
      { property: "og:title", content: "Catalogue — Medora Admin workspace" },
      {
        property: "og:description",
        content: "Administrator view of catalogue provenance and review state.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CataloguePage,
});

const reviewLabel = {
  published: "Published",
  needs_review: "Needs review",
  quarantined: "Quarantined",
} as const;

const reviewTone = {
  published: "positive",
  needs_review: "warning",
  quarantined: "danger",
} as const;

const STALE_DAYS = 90;

function isStale(record: CatalogueRecord) {
  return daysUntil(record.lastReviewed) < -STALE_DAYS;
}

function CataloguePage() {
  const catalogue = useWorkspaceData("catalogue");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = catalogue.data ?? [];
  const selected = rows.find((r) => r.id === openId) ?? null;

  const columns: DataColumn<CatalogueRecord>[] = [
    {
      key: "brandName",
      header: "Medicine",
      sortValue: (r) => r.brandName,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.brandName}</p>
          <p className="text-xs text-muted-foreground">{r.genericName}</p>
        </div>
      ),
    },
    {
      key: "compositionKey",
      header: "Composition",
      hideBelow: "lg",
      sortValue: (r) => r.compositionKey,
      render: (r) => (
        <span className="numeric text-xs text-muted-foreground">
          {r.compositionKey}
        </span>
      ),
    },
    {
      key: "form",
      header: "Form",
      hideBelow: "md",
      sortValue: (r) => r.form,
      render: (r) => r.form,
    },
    {
      key: "source",
      header: "Source",
      hideBelow: "md",
      sortValue: (r) => r.source,
      render: (r) => r.source,
    },
    {
      key: "lastReviewed",
      header: "Last reviewed",
      sortValue: (r) => r.lastReviewed,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <span>{shortDate(`${r.lastReviewed}T00:00:00.000Z`)}</span>
          {isStale(r) && (
            <AlertTriangle className="size-3.5 text-warning" aria-hidden />
          )}
        </div>
      ),
    },
    {
      key: "reviewState",
      header: "Review state",
      sortValue: (r) => r.reviewState,
      render: (r) => (
        <StatusPill
          label={reviewLabel[r.reviewState]}
          tone={reviewTone[r.reviewState]}
        />
      ),
    },
  ];

  const sourceOptions = Array.from(new Set(rows.map((r) => r.source))).map(
    (source) => ({
      value: source,
      label: source,
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue"
        demo
        description="Sample catalogue metadata. Every clinical claim shown here traces back to a stated source and a last-reviewed date — records without recent review are flagged."
      />

      <WorkspaceSection
        title="Catalogue records"
        description="Filter by source and review state. Stale records (not reviewed in over 90 days) are marked."
      >
        <AsyncSection
          query={catalogue}
          emptyIcon={Pill}
          emptyTitle="No catalogue records found"
          emptyDescription="Catalogue entries will appear here once loaded."
          isEmpty={(d) => d.length === 0}
        >
          {(data) => (
            <DataTable
              rows={data}
              columns={columns}
              getId={(r) => r.id}
              searchText={(r) =>
                `${r.brandName} ${r.genericName} ${r.compositionKey}`
              }
              searchPlaceholder="Search by brand, generic or composition…"
              initialSort={{ key: "brandName", direction: "asc" }}
              pageSize={8}
              filters={[
                {
                  key: "source",
                  label: "Source",
                  options: sourceOptions,
                  predicate: (r, v) => r.source === v,
                },
                {
                  key: "reviewState",
                  label: "Review state",
                  options: Object.entries(reviewLabel).map(
                    ([value, label]) => ({ value, label }),
                  ),
                  predicate: (r, v) => r.reviewState === v,
                },
              ]}
              onRowClick={(r) => setOpenId(r.id)}
              rowActions={(r) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenId(r.id)}
                >
                  Provenance
                </Button>
              )}
            />
          )}
        </AsyncSection>
      </WorkspaceSection>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setOpenId(null)}
      >
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.brandName}</DialogTitle>
                <DialogDescription>
                  {selected.genericName} · {selected.form}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Composition key
                  </dt>
                  <dd className="numeric mt-0.5 text-xs">
                    {selected.compositionKey}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Metadata completeness
                  </dt>
                  <dd className="numeric mt-0.5">
                    {Math.round(selected.metadataCompleteness * 100)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Review state
                  </dt>
                  <dd className="mt-0.5">
                    <StatusPill
                      label={reviewLabel[selected.reviewState]}
                      tone={reviewTone[selected.reviewState]}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Last reviewed
                  </dt>
                  <dd className="mt-0.5">
                    {shortDate(`${selected.lastReviewed}T00:00:00.000Z`)}
                  </dd>
                </div>
              </dl>

              <div className="rounded-md border border-border bg-secondary/50 p-3 text-sm">
                <p className="font-medium text-ink">Provenance</p>
                <p className="mt-1 text-muted-foreground">
                  All clinical and composition claims for this record come from{" "}
                  <span className="font-medium text-foreground/90">
                    {selected.source}
                  </span>
                  , last reviewed on{" "}
                  {shortDate(`${selected.lastReviewed}T00:00:00.000Z`)}. This is
                  a sample record — no licensed regulatory feed is connected in
                  this environment.
                </p>
              </div>

              {isStale(selected) && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-soft p-3 text-sm text-warning-foreground"
                >
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <p>
                    This record has not been reviewed in over {STALE_DAYS} days.
                    It needs a fresh provenance review before its claims should
                    be trusted.
                  </p>
                </div>
              )}
              {selected.reviewState !== "published" && !isStale(selected) && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-soft p-3 text-sm text-warning-foreground"
                >
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <p>
                    This record is marked{" "}
                    {reviewLabel[selected.reviewState].toLowerCase()} and is not
                    yet published to patients.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenId(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
