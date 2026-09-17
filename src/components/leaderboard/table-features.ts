/**
 * leaderboard/table-features.ts
 * Shared @tanstack/react-table v9 configuration for the leaderboard grid.
 *
 * Features are tree-shakeable in v9 — we only register the ones we use:
 *  - rowSortingFeature     (period-tab / column sorting)
 *  - globalFilteringFeature (instant name / masked-id search)
 *  - columnPinningFeature   (sticky masked-id + name columns for mobile)
 *
 * Row models & the sort/filter registries are plugs on the same features
 * object, which keeps the bundle small while enabling client-side ordering
 * and the global text filter.
 */
import {
  columnFilteringFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
} from "@tanstack/react-table";

/** Cohort origin selections used by the filter pills. */
export type CohortValue = "all" | "23" | "24" | "legacy";

/** Custom column filter mapping a cohort selection to `origin_tag` values. */
function cohortFilterFn(
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: CohortValue
): boolean {
  const tag = String(row.getValue(columnId) ?? "");
  switch (filterValue) {
    case "all":
      return true;
    case "23":
      return /23/.test(tag);
    case "24":
      return /24/.test(tag);
    case "legacy":
      return !/23|24/.test(tag);
    default:
      return true;
  }
}

/** The exact feature set used by the leaderboard table (type + runtime). */
export const leaderboardFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  globalFilteringFeature,
  columnPinningFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString, cohort: cohortFilterFn },
  sortFns: { basic: sortFn_basic },
  columnMeta: {} as { className?: string },
});

export type LeaderboardFeatures = typeof leaderboardFeatures;