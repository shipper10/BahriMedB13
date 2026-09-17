"use client";

import * as React from "react";
import { Target, Info } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { YEAR_LABELS, YEAR_WEIGHTS } from "@/lib/gpa/weights";

/**
 * gpa-simulator.tsx — Interactive What-If GPA Simulator (Phase 6).
 *
 * Lets the student enter expected year GPAs for the upcoming clinical years
 * (4–6) and instantly sees the projected graduation CGPA using the Faculty's
 * cumulative percentage weights (5% → 40%). Completed pre-clinical years are
 * taken as fixed so the projection is anchored on real data.
 */

export interface CompletedYear {
  year: number; // 1..6
  yearGpa: number | null;
}

type Props = {
  completedYears: CompletedYear[];
  labels: {
    title: string;
    subtitle: string;
    year: string;
    weight: string;
    gpa: string;
    completed: string;
    predicted: string;
    projectedCgpa: string;
    currentCgpa: string;
    hint: string;
    missing: string;
  };
  /** Localized clinical-phase note. */
  clinicalNote: string;
};

const clampGpa = (v: number) => Math.min(4, Math.max(0, v));

export function GpaSimulator({ completedYears, labels, clinicalNote }: Props) {
  const completed = React.useMemo(() => new Set(completedYears.map((c) => c.year)), [completedYears]);

  const currentCgpa = React.useMemo(() => {
    let num = 0;
    let den = 0;
    for (const c of completedYears) {
      if (c.yearGpa == null) continue;
      const w = YEAR_WEIGHTS[c.year - 1] ?? 0;
      num += w * c.yearGpa;
      den += w;
    }
    return den === 0 ? null : clampGpa(num / den);
  }, [completedYears]);

  // Default starting guess for future years = current CGPA (or mid B = 3.0).
  const defaultGuess = Math.round((currentCgpa ?? 3.0) * 100) / 100;

  const [inputs, setInputs] = React.useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (let y = 1; y <= 6; y++) {
      if (!completed.has(y)) init[y] = defaultGuess.toString();
    }
    return init;
  });

  const setInput = (year: number, raw: string) => {
    const cleaned = raw.replace(",", ".");
    if (cleaned !== "" && Number.isNaN(Number(cleaned))) return;
    setInputs((prev) => ({ ...prev, [year]: cleaned }));
  };

  const projectedCgpa = React.useMemo(() => {
    let num = 0;
    for (const c of completedYears) {
      if (c.yearGpa == null) continue;
      num += (YEAR_WEIGHTS[c.year - 1] ?? 0) * c.yearGpa;
    }
    let filledAll = true;
    for (let y = 1; y <= 6; y++) {
      if (completed.has(y)) continue;
      const raw = inputs[y];
      const val = Number(raw);
      if (raw === "" || Number.isNaN(val)) {
        filledAll = false;
        continue;
      }
      num += (YEAR_WEIGHTS[y - 1] ?? 0) * clampGpa(val);
    }
    // Weights sum to 1 across all 6 years, so the total denominator is 1.
    return filledAll ? clampGpa(num) : null;
  }, [completedYears, inputs, completed]);

  const totalWeight = YEAR_WEIGHTS[0] + YEAR_WEIGHTS[1] + YEAR_WEIGHTS[2];

return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{labels.title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {labels.subtitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Year weight table + inputs */}
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{labels.year}</th>
                <th className="px-3 py-2 text-left font-medium">{labels.weight}</th>
                <th className="px-3 py-2 text-left font-medium">{labels.gpa}</th>
              </tr>
            </thead>
            <tbody>
              {YEAR_WEIGHTS.map((w, idx) => {
                const year = idx + 1;
                const isCompleted = completed.has(year);
                const yearGpa = completedYears.find((c) => c.year === year)?.yearGpa;
                return (
                  <tr key={year} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {YEAR_LABELS[idx]}
                      {isCompleted ? (
                        <span className="ms-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {labels.completed}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{(w * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2">
                      {isCompleted ? (
                        <span className="font-semibold">
                          {yearGpa != null ? yearGpa.toFixed(2) : "—"}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={4}
                            step={0.1}
                            value={inputs[year] ?? ""}
                            onChange={(e) => setInput(year, e.target.value)}
                            className="h-8 w-24 font-mono"
                            aria-label={`${YEAR_LABELS[idx]} ${labels.gpa}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {labels.predicted}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="flex items-start gap-2 rounded-lg bg-muted/70 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            {clinicalNote} ({totalWeight * 100}%)
          </span>
        </p>

        {/* Results */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-muted/40 p-4">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {labels.currentCgpa}
            </Label>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {currentCgpa != null ? currentCgpa.toFixed(2) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {labels.projectedCgpa}
            </Label>
            <p className="mt-1 text-2xl font-bold text-primary">
              {projectedCgpa != null ? projectedCgpa.toFixed(2) : labels.missing}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}