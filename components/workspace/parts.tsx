import { AlertTriangle, RefreshCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/primitives";
import { cn } from "@/lib/utils";

/** Every AI-derived block in a professional workspace must be wrapped in this. */
export function AiAssistNotice({
  title = "AI-assisted — requires professional review",
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-primary/30 bg-primary-soft/60 p-4",
        className,
      )}
      aria-label={title}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {title}
      </p>
      <div className="mt-2 text-sm text-foreground/90">{children}</div>
      <p className="mt-3 border-t border-primary/20 pt-2 text-xs text-muted-foreground">
        Assistive output only. It is never a prescription, diagnosis or dose,
        and it is never applied without a qualified professional recording the
        decision.
      </p>
    </section>
  );
}

export function AiAssistTag({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-primary/40 text-primary", className)}
    >
      AI-assisted — requires professional review
    </Badge>
  );
}

export function WorkspaceSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-ink">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({
  label,
  children,
  tone = "neutral",
}: {
  label?: string | undefined;
  children?: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info" | undefined;
}) {
  const map = {
    neutral: "border-border bg-secondary text-muted-foreground",
    positive: "border-success/35 bg-success-soft text-success",
    warning: "border-warning/40 bg-warning-soft text-warning-foreground",
    danger: "border-destructive/40 bg-destructive-soft text-destructive",
    info: "border-primary/30 bg-primary-soft text-primary",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        map[tone],
      )}
    >
      {label ?? children}
    </span>
  );
}

export function Timeline({
  items,
}: {
  items: {
    id: string;
    at: string;
    title: string;
    body?: string;
    meta?: string;
    tone?: "default" | "ai";
  }[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
    );
  }
  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden
            className={cn(
              "absolute -left-[26px] top-1.5 size-2.5 rounded-full border-2 border-card",
              item.tone === "ai" ? "bg-primary" : "bg-border-strong",
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            {item.tone === "ai" && <AiAssistTag />}
          </div>
          {item.body && (
            <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {item.at}
            {item.meta ? ` · ${item.meta}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function AsyncSection<T>({
  query,
  children,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  skeletonRows = 5,
  isEmpty,
}: {
  query: {
    data: T | undefined;
    isPending: boolean;
    isError: boolean;
    error?: unknown;
    refetch: () => void;
  };
  children: (data: T) => ReactNode;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  skeletonRows?: number;
  isEmpty?: (data: T) => boolean;
}) {
  if (query.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive-soft p-5"
      >
        <p className="flex items-center gap-2 font-semibold text-ink">
          <AlertTriangle className="size-4 text-destructive" aria-hidden /> This
          view could not load
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          The workspace provider did not return data. Nothing has been changed,
          and no partial or invented records are shown.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => query.refetch()}
        >
          <RefreshCw className="size-4" aria-hidden /> Try again
        </Button>
      </div>
    );
  }

  if (isEmpty?.(query.data)) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return <>{children(query.data)}</>;
}
