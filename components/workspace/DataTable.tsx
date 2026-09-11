import { ArrowDown, ArrowUp, ChevronsUpDown, Search, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center" | undefined;
  /** Hide below the lg breakpoint to keep tables readable on small screens. */
  hideBelow?: "sm" | "md" | "lg" | undefined;
  width?: string | undefined;
}

export interface DataFilter<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  predicate: (row: T, value: string) => boolean;
}

interface DataTableProps<T> {
  rows: T[];
  columns: DataColumn<T>[];
  getId?: ((row: T) => string) | undefined;
  searchText?: ((row: T) => string) | undefined;
  searchPlaceholder?: string | undefined;
  filters?: DataFilter<T>[] | undefined;
  rowActions?: ((row: T) => ReactNode) | undefined;
  bulkActions?: ((ids: string[], clear: () => void) => ReactNode) | undefined;
  onRowClick?: ((row: T) => void) | undefined;
  pageSize?: number | undefined;
  initialSort?: { key: string; direction: "asc" | "desc" } | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  toolbarExtra?: ReactNode | undefined;
  ariaLabel?: string | undefined;
}

const hideClass = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

export function DataTable<T>({
  rows,
  columns,
  getId,
  searchText,
  searchPlaceholder = "Search…",
  filters = [],
  rowActions,
  bulkActions,
  onRowClick,
  pageSize = 8,
  initialSort,
  emptyTitle = "Nothing matches these filters",
  emptyDescription = "Adjust the search or filters to widen the result set.",
  toolbarExtra,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(initialSort ?? null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const resolveId = useMemo(() => {
    return (
      getId ??
      ((row: any) =>
        String(
          row?.id ?? row?._id ?? row?.key ?? row?.code ?? JSON.stringify(row),
        ))
    );
  }, [getId]);

  const resolveSearch = useMemo(() => {
    return (
      searchText ??
      ((row: any) => {
        if (!row || typeof row !== "object") return String(row ?? "");
        return Object.values(row)
          .filter((v) => typeof v === "string" || typeof v === "number")
          .join(" ");
      })
    );
  }, [searchText]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((row) =>
      q ? resolveSearch(row).toLowerCase().includes(q) : true,
    );
    for (const filter of filters) {
      const value = filterValues[filter.key];
      if (value && value !== "all")
        out = out.filter((row) => filter.predicate(row, value));
    }
    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      if (column?.sortValue) {
        const dir = sort.direction === "asc" ? 1 : -1;
        out = [...out].sort((a, b) => {
          const av = column.sortValue!(a);
          const bv = column.sortValue!(b);
          if (typeof av === "number" && typeof bv === "number")
            return (av - bv) * dir;
          return String(av).localeCompare(String(bv)) * dir;
        });
      }
    }
    return out;
  }, [rows, query, filterValues, filters, sort, columns, resolveSearch]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );
  const pageIds = pageRows.map(resolveId);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const activeFilters =
    Object.values(filterValues).filter((v) => v && v !== "all").length +
    (query ? 1 : 0);

  const reset = () => {
    setQuery("");
    setFilterValues({});
    setPage(0);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label={searchPlaceholder}
          />
        </div>
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={filterValues[filter.key] ?? "all"}
            onValueChange={(value) => {
              setFilterValues((prev) => ({ ...prev, [filter.key]: value }));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-[165px]" aria-label={filter.label}>
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.label}: all</SelectItem>
              {filter.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="size-4" aria-hidden /> Clear
          </Button>
        )}
        {toolbarExtra}
      </div>

      {bulkActions && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary-soft px-3 py-2 text-sm">
          <span className="font-medium text-ink">
            {selected.length} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {bulkActions(selected, () => setSelected([]))}
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear selection
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {bulkActions && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allOnPageSelected}
                    aria-label="Select all rows on this page"
                    onCheckedChange={(checked) =>
                      setSelected((prev) =>
                        checked
                          ? [...new Set([...prev, ...pageIds])]
                          : prev.filter((id) => !pageIds.includes(id)),
                      )
                    }
                  />
                </TableHead>
              )}
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue);
                const active = sort?.key === column.key;
                return (
                  <TableHead
                    key={column.key}
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.hideBelow && hideClass[column.hideBelow],
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort((prev) =>
                            prev?.key === column.key
                              ? {
                                  key: column.key,
                                  direction:
                                    prev.direction === "asc" ? "desc" : "asc",
                                }
                              : { key: column.key, direction: "asc" },
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-1 font-medium hover:text-ink",
                          column.align === "right" && "flex-row-reverse",
                          active && "text-ink",
                        )}
                      >
                        {column.header}
                        {active ? (
                          sort?.direction === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown
                            className="size-3.5 opacity-50"
                            aria-hidden
                          />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
              {rowActions && (
                <TableHead className="w-[1%] text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (rowActions ? 1 : 0) +
                    (bulkActions ? 1 : 0)
                  }
                  className="py-12 text-center"
                >
                  <p className="font-medium text-ink">{emptyTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {emptyDescription}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const id = resolveId(row);
                return (
                  <TableRow
                    key={id}
                    data-state={selected.includes(id) ? "selected" : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(onRowClick && "cursor-pointer")}
                  >
                    {bulkActions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(id)}
                          aria-label={`Select row ${id}`}
                          onCheckedChange={(checked) =>
                            setSelected((prev) =>
                              checked
                                ? [...prev, id]
                                : prev.filter((x) => x !== id),
                            )
                          }
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.align === "right" && "text-right",
                          column.align === "center" && "text-center",
                          column.hideBelow && hideClass[column.hideBelow],
                        )}
                      >
                        {column.render(row)}
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rowActions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {filtered.length === 0
            ? "No rows"
            : `Showing ${safePage * pageSize + 1}–${Math.min(filtered.length, safePage * pageSize + pageSize)} of ${filtered.length}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            Previous
          </Button>
          <span className="numeric text-xs">
            Page {safePage + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
