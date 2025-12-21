"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Props = {
  distribution: Record<string, number>;
};

const GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

function buildData(dist: Record<string, number>) {
  return GRADE_ORDER.filter((g) => dist[g] !== undefined).map((g) => ({
    grade: g,
    students: dist[g],
  }));
}

export default function GradeHistogram({ distribution }: Props) {
  const data = buildData(distribution);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="grade" />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value) => [`${value}`, "Students"]} labelFormatter={(label) => `Grade ${label}`} />
          <Bar dataKey="students" radius={[6, 6, 0, 0]} className="fill-orange-500 dark:fill-orange-400" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
