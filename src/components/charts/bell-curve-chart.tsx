"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

/**
 * bell-curve-chart.tsx — Recharts histogram of a course's grade distribution
 * across the cohort. Renders a single band (F / C / B / B+ / A) per bar so
 * it reads as a classic grade bell-curve.
 *
 * Pure presentational client component.
 */

export interface GradeBin {
  /** Band label, e.g. "A" or "80-100". */
  band: string;
  /** Number of students whose numeric score fell in this band. */
  count: number;
}

/** Deterministic colour per grade band (matches GRADE_SCALE ordering). */
export const BAND_COLORS: Record<string, string> = {
  A: "#16a34a",
  "B+": "#7c3aed",
  B: "#8b5cf6",
  C: "#d97706",
  F: "#dc2626",
};

type Props = {
  data: GradeBin[];
  /** Localized axis label, e.g. "عدد الطلاب". */
  axisStudents: string;
};

export function BellCurveChart({ data, axisStudents }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 4, left: -16 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="band"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          label={{
            value: axisStudents,
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle", fontSize: 12 },
          }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{ borderRadius: 8, fontSize: 13 }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={BAND_COLORS[entry.band] ?? "#6d28d9"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}