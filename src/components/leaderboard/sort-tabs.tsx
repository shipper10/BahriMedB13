"use client";

/**
 * leaderboard/sort-tabs.tsx
 * Period / ranking metric selector. Each tab maps to a sortable table column:
 *  - cumulative_gpa  → Overall CGPA
 *  - year_gpa        → Full first-year GPA
 *  - semester_gpa_1  → Semester 1
 *  - semester_gpa_2  → Semester 2
 *  - course          → Per-specific-course rank (placeholder)
 */
import { PieChart, CalendarDays, Sun, Moon, BookOpen, ArrowUpAZ } from "lucide-react";

import { cn } from "@/lib/utils";

export type SortMetric =
  | "cgpa"
  | "year"
  | "semester1"
  | "semester2"
  | "course"
  | "name";

export interface SortTabOption {
  value: SortMetric;
  label: string;
  icon: typeof PieChart;
  disabled?: boolean;
}

const TAB_ICONS: Record<SortMetric, typeof PieChart> = {
  cgpa: PieChart,
  year: CalendarDays,
  semester1: Sun,
  semester2: Moon,
  course: BookOpen,
  name: ArrowUpAZ,
};

export function SortTabs({
  options,
  value,
  onChange,
}: {
  options: SortTabOption[];
  value: SortMetric;
  onChange: (value: SortMetric) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="periods"
      className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1"
    >
      {options.map((opt) => {
        const Icon = opt.icon ?? TAB_ICONS[opt.value];
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              opt.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Icon className="size-3.5" />
            {opt.label}
            {opt.disabled && (
              <span className="sr-only">(disabled)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { TAB_ICONS };