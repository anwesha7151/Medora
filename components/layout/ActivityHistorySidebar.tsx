import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  History,
  Search,
  Pill,
  GitCompare,
  Camera,
  ShoppingBag,
  Bell,
  FileText,
  Trash2,
  X,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { shortDateTime } from "@/services/workspace";
import type { UserActivityItem } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface ActivityHistorySidebarProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

const ACTION_CONFIG: Record<
  UserActivityItem["action"],
  { label: string; icon: typeof Search; color: string }
> = {
  search: { label: "Search", icon: Search, color: "text-primary" },
  view_medicine: { label: "Medicine View", icon: Pill, color: "text-primary" },
  compare: { label: "Comparison", icon: GitCompare, color: "text-chart-2" },
  scan: { label: "Bottle Scan", icon: Camera, color: "text-chart-3" },
  order: { label: "Order", icon: ShoppingBag, color: "text-chart-4" },
  reminder: { label: "Reminder", icon: Bell, color: "text-warning" },
  clinical_note: { label: "Clinical Note", icon: FileText, color: "text-ink" },
  verification: { label: "Verification", icon: History, color: "text-primary" },
};

export function ActivityHistorySidebar({
  open,
  onClose,
  className,
}: ActivityHistorySidebarProps) {
  const { state, clearActivities } = useStore();
  const [filterAction, setFilterAction] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!open) return null;

  const activities = state.activities ?? [];

  const filteredActivities = activities.filter((act) => {
    const matchesFilter = filterAction === "all" || act.action === filterAction;
    const matchesSearch =
      !searchQuery ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.detail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div
      id="activity-history-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <aside
        id="activity-history-panel"
        className={cn(
          "rise relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-lift",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Activity History"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4.5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-primary-soft text-primary">
              <History className="size-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Activity History
              </h2>
              <p className="text-xs text-muted-foreground">
                {activities.length} recorded session action
                {activities.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {activities.length > 0 && (
              <Button
                id="clear-activity-history-btn"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearActivities}
                title="Clear activity history"
              >
                <Trash2 className="mr-1 size-3.5" />
                Clear
              </Button>
            )}
            <Button
              id="close-activity-history-btn"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={onClose}
              aria-label="Close activity history"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-3 border-b border-border bg-secondary/30 p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="activity-history-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recorded actions…"
              className="h-9 pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs">
            <button
              id="activity-filter-all"
              type="button"
              onClick={() => setFilterAction("all")}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                filterAction === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80",
              )}
            >
              All
            </button>
            {Object.entries(ACTION_CONFIG).map(([key, config]) => {
              const count = activities.filter((a) => a.action === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  id={`activity-filter-${key}`}
                  type="button"
                  onClick={() => setFilterAction(key)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors",
                    filterAction === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80",
                  )}
                >
                  <config.icon className="size-3" />
                  <span>{config.label}</span>
                  <span className="ml-0.5 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredActivities.length === 0 ? (
            <div className="grid h-48 place-content-center text-center">
              <History className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-ink">
                No activity found
              </p>
              <p className="text-xs text-muted-foreground">
                {searchQuery || filterAction !== "all"
                  ? "Try resetting your search or filter."
                  : "Your searches, viewed medicines, and scans will appear here."}
              </p>
            </div>
          ) : (
            <ol className="relative space-y-3 border-l border-border pl-4">
              {filteredActivities.map((act) => {
                const config =
                  ACTION_CONFIG[act.action] ?? ACTION_CONFIG.search;
                const IconComponent = config.icon;

                return (
                  <li
                    key={act.id}
                    id={`activity-item-${act.id}`}
                    className="group relative rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-secondary/20"
                  >
                    {/* Bullet marker on timeline */}
                    <span
                      aria-hidden
                      className="absolute -left-[23px] top-3.5 grid size-3.5 place-items-center rounded-full border border-border bg-card text-primary shadow-xs"
                    >
                      <span className="size-1.5 rounded-full bg-primary" />
                    </span>

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <IconComponent
                          className={cn("size-3.5 shrink-0", config.color)}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {config.label}
                        </span>
                      </div>
                      <time className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {shortDateTime(act.timestamp)}
                      </time>
                    </div>

                    <p className="mt-1.5 text-xs font-medium text-ink">
                      {act.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {act.detail}
                    </p>

                    {act.action === "search" && (
                      <Link
                        to="/app/search"
                        search={{
                          q: act.title.replace(/^Searched\s*'|'$/g, ""),
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                        onClick={onClose}
                      >
                        Repeat search
                        <ChevronRight className="size-3" />
                      </Link>
                    )}

                    {act.action === "compare" && (
                      <Link
                        to="/app/compare"
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                        onClick={onClose}
                      >
                        View comparison
                        <ChevronRight className="size-3" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 p-3.5 text-center text-xs text-muted-foreground">
          Medora logs your active session activities locally for quick recall.
        </div>
      </aside>
    </div>
  );
}
