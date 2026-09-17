/**
 * leaderboard/columns.tsx
 * TanStack Table v9 column definitions for the responsive leaderboard.
 *
 * Privacy & localization handled here:
 *  - The view ships a server-side masked id (`11****23`) — rendered as-is.
 *  - A single Name column dynamically renders the Arabic name for an Arabic
 *    (RTL) UI and the English name for an English UI, all in one column.
 */
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import type { LeaderboardFeatures } from "./table-features";

/** A single flattened leaderboard row (one row per student). */
export interface LeaderboardRow {
  student_id: string;
  masked_id: string;
  display_name_ar: string | null;
  display_name_en: string | null;
  origin_tag: string;
  status: string;
  remark: string | null;
  rank_overall: number | null;
  /** Semester 1 (Y1_S1) GPA */
  semester_gpa_1: number | null;
  /** Semester 2 (Y1_S2) GPA */
  semester_gpa_2: number | null;
  /** Full first-year GPA (latest non-null record) */
  year_gpa: number | null;
  /** Cumulative GPA */
  cumulative_gpa: number | null;
}

/** Localized header/cell labels consumed when building columns. */
export interface LeaderboardLabels {
  maskedId: string;
  name: string;
  group: string;
  cgpa: string;
  yearGpa: string;
  semester1: string;
  semester2: string;
  status: string;
}

const columnHelper = createColumnHelper<LeaderboardFeatures, LeaderboardRow>();

function formatGpa(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(2);
}

/**
 * Builds the column set for the leaderboard.
 * @param labels - localized strings.
 * @param nameFor - returns the localized name for a row (ar or en).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildLeaderboardColumns(
  labels: LeaderboardLabels,
  nameFor: (row: LeaderboardRow) => string
): ColumnDef<LeaderboardFeatures, LeaderboardRow, any>[] { /* eslint-disable-line @typescript-eslint/no-explicit-any */
  return [
    columnHelper.accessor("rank_overall", {
      id: "rank_overall",
      header: "#",
      enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue<number | null>();
        return v != null ? (
          <span className="font-bold tabular-nums text-primary">#{v}</span>
        ) : "—";
      },
      meta: { className: "w-12 text-center" },
    }),

    // ── Sticky #1: server-side masked id ────────────────────────────────
    columnHelper.accessor("masked_id", {
      id: "masked_id",
      header: labels.maskedId,
      enableSorting: false,
      enableGlobalFilter: true,
      cell: ({ getValue }) => (
        <span dir="ltr" className="font-mono text-sm font-medium tracking-wider">
          {getValue<string>()}
        </span>
      ),
      meta: { className: "min-w-[7.5rem]" },
    }),

    // ── Sticky #2: single dynamic (ar/en) name column ────────────────────
    columnHelper.accessor(nameFor, {
      id: "name",
      header: labels.name,
      enableSorting: true,
      enableGlobalFilter: true,
      sortFn: (rowA: any, rowB: any, columnId: string) => {
        const a = nameFor(rowA.original) ?? "";
        const b = nameFor(rowB.original) ?? "";
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      },
      cell: ({ row }) => {
        const fullName = nameFor(row.original);
        const shortName = fullName.split(" ").slice(0, 2).join(" ");
        return (
          <div className="min-w-[11rem] max-w-[16rem]">
            <span className="block truncate font-medium text-foreground md:hidden">
              {shortName}
            </span>
            <span className="hidden truncate font-medium text-foreground md:block">
              {fullName}
            </span>
          </div>
        );
      },
      meta: { className: "min-w-[11rem]" },
    }),

    // ── Group / cohort origin ──────────────────────────────────────────────
    columnHelper.accessor("origin_tag", {
      id: "origin_tag",
      header: labels.group,
      enableSorting: false,
      enableGlobalFilter: false,
      filterFn: "cohort",
      cell: ({ getValue }) => (
        <Badge variant="outline" className="font-mono">
          {getValue<string>()}
        </Badge>
      ),
    }),

    // ── Semester 1 GPA ─────────────────────────────────────────────────────
    columnHelper.accessor("semester_gpa_1", {
      id: "semester_gpa_1",
      header: labels.semester1,
      sortDescFirst: true,
      cell: ({ getValue }) => formatGpa(getValue<number | null>()),
      meta: { className: "text-center tabular-nums" },
    }),

    // ── Semester 2 GPA ─────────────────────────────────────────────────────
    columnHelper.accessor("semester_gpa_2", {
      id: "semester_gpa_2",
      header: labels.semester2,
      sortDescFirst: true,
      cell: ({ getValue }) => formatGpa(getValue<number | null>()),
      meta: { className: "text-center tabular-nums" },
    }),

    // ── Full Year 1 GPA ─────────────────────────────────────────────────────
    columnHelper.accessor("year_gpa", {
      id: "year_gpa",
      header: labels.yearGpa,
      sortDescFirst: true,
      cell: ({ getValue }) => (
        <span className="font-semibold">
          {formatGpa(getValue<number | null>())}
        </span>
      ),
      meta: { className: "text-center tabular-nums" },
    }),

    // ── Cumulative CGPA ─────────────────────────────────────────────────────
    columnHelper.accessor("cumulative_gpa", {
      id: "cumulative_gpa",
      header: labels.cgpa,
      sortDescFirst: true,
      cell: ({ getValue }) => {
        const v = getValue<number | null>();
        return (
          <Badge variant={v == null ? "outline" : "success"}>
            {formatGpa(v)}
          </Badge>
        );
      },
      meta: { className: "text-center tabular-nums" },
    }),

    // ── Status ──────────────────────────────────────────────────────────────
    columnHelper.accessor("status", {
      id: "status",
      header: labels.status,
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ getValue }) => (
        <Badge variant="muted">{getValue<string>()}</Badge>
      ),
    }),
  ];
}