import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ClinicalDisclaimer,
  EmptyState,
  IntegrationNotConnected,
  PageHeader,
  SafetyNotice,
} from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { demoLabReport } from "@/data/demo-catalog";
import type { LabValue } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { settle } from "@/services/provider";

export const Route = createFileRoute("/app/labs")({
  head: () => ({
    meta: [
      { title: "Lab reports — Medora" },
      {
        name: "description",
        content:
          "Understand what each test on your lab report measures and whether the value sits inside the range printed on the report.",
      },
      { property: "og:title", content: "Lab reports — Medora" },
      {
        property: "og:description",
        content: "Plain-language explanations of lab test names and ranges.",
      },
    ],
  }),
  component: LabsPage,
});

const flagMeta: Record<LabValue["flag"], { label: string; cls: string }> = {
  within_range: {
    label: "Within printed range",
    cls: "border-success/35 bg-success-soft text-success",
  },
  outside_range: {
    label: "Outside printed range",
    cls: "border-warning/40 bg-warning-soft text-warning-foreground",
  },
  no_range_provided: {
    label: "No range on report",
    cls: "border-border bg-secondary text-muted-foreground",
  },
};

function LabsPage() {
  const { state, addLabReport } = useStore();
  const [uploading, setUploading] = useState(false);

  const simulateUpload = async () => {
    setUploading(true);
    const parsed = await settle(
      {
        ...demoLabReport,
        id: `lab-${Math.random().toString(36).slice(2, 8)}`,
        uploadedAt: new Date().toISOString(),
      },
      900,
    );
    addLabReport(parsed);
    setUploading(false);
    toast.success("Sample report parsed", {
      description:
        "Demo parsing only — values come from Medora's sample report, not your file.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lab reports"
        demo
        description="Medora explains what each test measures and compares it to the reference range printed on the report. It never interprets results for you."
        actions={
          <Button onClick={() => void simulateUpload()} disabled={uploading}>
            <Upload className="size-4" aria-hidden />
            {uploading ? "Parsing…" : "Upload a report"}
          </Button>
        }
      />

      <IntegrationNotConnected integration="labParsing" />

      {uploading && (
        <div className="surface space-y-3 p-5">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!uploading && state.labReports.length === 0 && (
        <EmptyState
          icon={FlaskConical}
          title="No reports yet"
          description="Upload a lab report and Medora will list each test with a plain-language explanation of what it measures."
          action={
            <Button onClick={() => void simulateUpload()}>
              <Upload className="size-4" aria-hidden /> Upload a report
            </Button>
          }
        />
      )}

      {state.labReports.map((report) => (
        <section key={report.id} className="surface p-5">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">{report.panel}</h2>
              <p className="text-sm text-muted-foreground">
                {report.fileName} · uploaded{" "}
                {new Date(report.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="outline">{report.values.length} tests</Badge>
          </header>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Reference range</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.values.map((v) => (
                  <TableRow key={v.name}>
                    <TableCell className="font-medium">
                      {v.name}
                      <p className="mt-1 max-w-md text-xs font-normal text-muted-foreground">
                        {v.explanation}
                      </p>
                    </TableCell>
                    <TableCell className="numeric text-right">
                      {v.value} {v.unit}
                    </TableCell>
                    <TableCell className="numeric text-muted-foreground">
                      {v.referenceRange || "Not printed"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={flagMeta[v.flag].cls}>
                        {flagMeta[v.flag].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}

      <SafetyNotice tone="warning" title="Ranges differ between laboratories">
        A value outside the printed range is not automatically a problem, and a
        value inside it does not rule anything out. Only the clinician who
        ordered the test can interpret it.
      </SafetyNotice>
      <ClinicalDisclaimer />
    </div>
  );
}
