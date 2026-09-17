"use client";

/**
 * leaderboard/data-table.tsx
 * The responsive TanStack Table v9 leaderboard grid.
 *
 * Features (registered in ./table-features):
 *  - columnFilteringFeature → cohort / batch origin pills
 *  - rowSortingFeature      → ranking sort (CGPA / year / semester tabs)
 *  - globalFilteringFeature → instant name / masked-id search
 *  - columnPinningFeature   → sticky masked-id + name columns on mobile
 *
 * Privacy: the grid only renders masked ids already produced server-side by
 * `vw_public_leaderboard` (e.g. `11****23`) — never the raw numeric id.
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  flexRender,
  useTable,
} from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { Search, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { leaderboardFeatures } from "./table-features";
import {
  buildLeaderboardColumns,
  type LeaderboardRow,
} from "./columns";
import {
  CohortFilter,
  cohortOptions,
  type CohortFilterValue,
} from "./cohort-filter";
import { SortTabs, TAB_ICONS, type SortMetric } from "./sort-tabs";

/** metric → table column id */
const METRIC_COLUMN: Record<SortMetric, string> = {
  cgpa: "cumulative_gpa",
  year: "year_gpa",
  semester1: "semester_gpa_1",
  semester2: "semester_gpa_2",
  course: "cumulative_gpa",
  name: "name",
};

/** table column id → metric */
const COLUMN_METRIC: Record<string, SortMetric> = {
  cumulative_gpa: "cgpa",
  year_gpa: "year",
  semester_gpa_1: "semester1",
  semester_gpa_2: "semester2",
  name: "name",
};


type LeaderboardT = ReturnType<typeof useTranslations<"Leaderboard">>;

function sortOptions(t: LeaderboardT): Array<{
  value: SortMetric;
  label: string;
  icon: typeof TAB_ICONS.cgpa;
  disabled?: boolean;
}> {
  return [
    { value: "cgpa", label: t("periods.cgpa"), icon: TAB_ICONS.cgpa },
    { value: "year", label: t("periods.year"), icon: TAB_ICONS.year },
    { value: "semester1", label: t("periods.semester1"), icon: TAB_ICONS.semester1 },
    { value: "semester2", label: t("periods.semester2"), icon: TAB_ICONS.semester2 },
    { value: "course", label: t("periods.course"), icon: TAB_ICONS.course, disabled: true },
    { value: "name", label: t("periods.name"), icon: TAB_ICONS.name },
  ];
}
/**
 * The main leaderboard data-table component.
 * Renders the toolbar (sort tabs, search, cohort pills) and the sticky table.
 */
export function LeaderboardDataTable({ data }: { data: LeaderboardRow[] }) {
  const locale = useLocale();
  const t = useTranslations("Leaderboard");

  const [metric, setMetric] = useState<SortMetric>("cgpa");
  const [cohort, setCohort] = useState<CohortFilterValue>("all");
  const [search, setSearch] = useState("");

  const labels = useMemo(
    () => ({
      maskedId: t("table.maskedId"),
      name: t("table.name"),
      group: t("table.group"),
      cgpa: t("table.cgpa"),
      yearGpa: t("table.yearGpa"),
      semester1: t("table.semester1"),
      semester2: t("table.semester2"),
      status: t("table.status"),
    }),
    [t]
  );

  const nameFor = useCallback(
    (row: LeaderboardRow) => {
      const primary = locale === "ar" ? row.display_name_ar : row.display_name_en;
      const fallback = locale === "ar" ? row.display_name_en : row.display_name_ar;
      return primary ?? fallback ?? "—";
    },
    [locale]
  );

  const columns = useMemo(
    () => buildLeaderboardColumns(labels, nameFor),
    [labels, nameFor]
  );

  const table = useTable(
    {
      features: leaderboardFeatures,
      columns,
      data,
      initialState: {
        sorting: [{ id: "cumulative_gpa", desc: true }],
        globalFilter: "",
        columnPinning: { start: ["rank_overall", "masked_id", "name"], end: [] },
        columnFilters: [],
        columnVisibility: {},
      },
      enableSorting: true,
      enableGlobalFilter: true,
      globalFilterFn: "includesString",
      getColumnCanGlobalFilter: (column) =>
        ["masked_id", "name"].includes(column.id),
    },
    (state) => ({
      sorting: state.sorting,
      globalFilter: state.globalFilter,
      columnFilters: state.columnFilters,
    })
  );

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  const handleMetricChange = useCallback(
    (next: SortMetric) => {
      setMetric(next);
      table.setSorting([{ id: METRIC_COLUMN[next], desc: true }]);
    },
    [table]
  );

  const handleCohortChange = useCallback(
    (next: CohortFilterValue) => {
      setCohort(next);
      if (next === "all") {
        table.setColumnFilters((prev) =>
          prev.filter((f) => f.id !== "origin_tag")
        );
      } else {
        table.setColumnFilters((prev) => {
          const without = prev.filter((f) => f.id !== "origin_tag");
          return [...without, { id: "origin_tag", value: next }];
        });
      }
      if (search.trim()) {
        table.setGlobalFilter(search);
      }
    },
    [table, search]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      table.setGlobalFilter(value);
    },
    [table]
  );

  const activeMetric = COLUMN_METRIC[table.state.sorting[0]?.id] ?? "cgpa";

  React.useEffect(() => {
    const handler = () => {
      const isMobile = window.innerWidth < 768;
      table.setColumnVisibility({
        status: !isMobile,
        origin_tag: !isMobile,
        semester_gpa_1: !isMobile,
        semester_gpa_2: !isMobile,
      });
    };
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [table]);

  return (
<Card className="overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SortTabs
            options={sortOptions(t)}
            value={metric}
            onChange={handleMetricChange}
          />
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="ps-9"
              aria-label={t("searchPlaceholder")}
            />
          </div>
        </div>
        <CohortFilter
          options={cohortOptions({
            all: t("filters.all"),
            group23: t("filters.group23"),
            group24: t("filters.group24"),
            legacy: t("filters.legacy"),
          })}
          value={cohort}
          onChange={handleCohortChange}
        />
      </div>
{/* ── Table body ───────────────────────────────────────────────── */}
      <div className="max-h-[65vh] overflow-auto [mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)] md:[mask-image:none]">
        <table className="min-w-full border-collapse text-start">
          <thead className="sticky top-0 z-20 bg-card">
            {headerGroups.map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "border-b border-border px-3 py-3 text-sm font-semibold",
                      header.column.getIsPinned() === "start" &&
                        "sticky start-0 z-30 bg-card",
                      header.column.getIsPinned() === "end" &&
                        "sticky end-0 z-30 bg-card"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { className?: string }
                      | null;
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-3 py-2.5 text-sm",
                          meta?.className,
                          cell.column.getIsPinned() === "start" &&
                            "sticky start-0 z-10 bg-card",
                          cell.column.getIsPinned() === "end" &&
                            "sticky end-0 z-10 bg-card"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headerGroups[0]?.headers.length ?? 8} className="p-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="size-8" />
                    <p className="text-sm">{t("emptyState")}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
{/* ── Footer metadata ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>
          {t("count", { count: rows.length })} ·{" "}
          {t("sortedBy", { metric: t(`periods.${activeMetric}`) })}
        </span>
        <span className="hidden sm:inline">{t("privacyNote")}</span>
      </div>
    </Card>
  );
}