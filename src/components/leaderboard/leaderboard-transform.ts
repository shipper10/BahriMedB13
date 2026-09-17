/**
 * leaderboard/leaderboard-transform.ts
 * Flattens the `vw_public_leaderboard` view output (one row per student per
 * semester) into a single row per student with the metric columns the grid
 * sorts on (Sem 1 GPA, Sem 2 GPA, full Year-1 GPA, cumulative CGPA).
 *
 * The raw view row shape mirrors the generated `database.types.ts`.
 */
import type { Database } from "@/types/database.types";
import type { LeaderboardRow } from "./columns";

export type LeaderboardViewRow =
  Database["public"]["Views"]["vw_public_leaderboard"]["Row"];

const pickLast = (rows: LeaderboardViewRow[], key: keyof LeaderboardViewRow) => {
  let value: number | null = null;
  for (const r of rows) {
    const v = r[key] as unknown as number | null;
    if (v !== null && v !== undefined && !Number.isNaN(v)) value = v;
  }
  return value;
};

/** Keeps the latest non-null GPA for each student across the result set. */
export function transformLeaderboardRows(
  rows: LeaderboardViewRow[]
): LeaderboardRow[] {
  const byStudent = new Map<string, LeaderboardViewRow[]>();

  for (const row of rows) {
    if (!row.student_id) continue;
    const list = byStudent.get(row.student_id);
    if (list) list.push(row);
    else byStudent.set(row.student_id, [row]);
  }

  const result: LeaderboardRow[] = [];
  for (const group of byStudent.values()) {
    const first = group[0];
    if (!first) continue;

    const semester1 = group.filter((r) =>
      r.semester_id?.toUpperCase().endsWith("S1")
    );
    const semester2 = group.filter((r) =>
      r.semester_id?.toUpperCase().endsWith("S2")
    );

    result.push({
      student_id: first.student_id,
      masked_id: first.masked_id,
      display_name_ar: first.display_name_ar,
      display_name_en: first.display_name_en,
      origin_tag: first.origin_tag,
      status: first.status,
      remark: first.remark,
      rank_overall: pickLast(group, "rank_overall") as number | null,
      semester_gpa_1: pickLast(semester1, "semester_gpa"),
      semester_gpa_2: pickLast(semester2, "semester_gpa"),
      year_gpa: pickLast(group, "year_gpa"),
      cumulative_gpa: pickLast(group, "cumulative_gpa"),
    });
  }

  // Default ordering: highest CGPA first (mirrors the CGPA period tab).
  return result.sort((a, b) => (b.cumulative_gpa ?? -1) - (a.cumulative_gpa ?? -1));
}