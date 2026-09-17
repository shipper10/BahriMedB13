"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * trajectory-chart.tsx — Recharts line plot of the student's academic
 * trajectory (semester GPA / year GPA / cumulative CGPA) across semesters.
 *
 * Pure presentational client component. Labels are passed in so the wording
 * can stay localized (ar / en). Data is small, serializable and server-free.
 */

export interface TrajectoryPoint {
  label: string;
  semesterGpa: number | null;
  yearGpa: number | null;
  cumulative: number | null;
}

type Props = {
  data: TrajectoryPoint[];
  nameSemester: string;
  nameYear: string;
  nameCumulative: string;
};

export function TrajectoryChart({
  data,
  nameSemester,
  nameYear,
  nameCumulative,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 4, left: -12 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 4]}
          ticks={[0, 1, 2, 3, 4]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 13 }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Line
          type="monotone"
          dataKey="semesterGpa"
          name={nameSemester}
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="yearGpa"
          name={nameYear}
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="cumulative"
          name={nameCumulative}
          stroke="#6d28d9"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}