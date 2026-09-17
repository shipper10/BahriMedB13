"use client";

/**
 * leaderboard/cohort-filter.tsx
 * Cohort origin filter pills: All Batch 13, Group 23, Group 24, Transfer/Legacy.
 */
import { Users, Layers, GraduationCap, Repeat } from "lucide-react";

import { cn } from "@/lib/utils";

export type CohortFilterValue = "all" | "23" | "24" | "legacy";

export interface CohortOption {
  value: CohortFilterValue;
  /** Labels already localized by the caller. */
  label: string;
  icon: typeof Users;
}

export function CohortFilter({
  options,
  value,
  onChange,
}: {
  options: CohortOption[];
  value: CohortFilterValue;
  onChange: (value: CohortFilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Default icons assigned per cohort value. */
export function cohortOptions(labels: {
  all: string;
  group23: string;
  group24: string;
  legacy: string;
}): CohortOption[] {
  return [
    { value: "all", label: labels.all, icon: Users },
    { value: "23", label: labels.group23, icon: Layers },
    { value: "24", label: labels.group24, icon: GraduationCap },
    { value: "legacy", label: labels.legacy, icon: Repeat },
  ];
}