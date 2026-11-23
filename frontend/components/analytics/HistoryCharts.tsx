"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { sortByTerm, termLabel } from "@/lib/analytics-summary";
import { displayLoadPercent, seatLoadPercent, ENROLLMENT_STATUS_TONES, getEnrollmentStatus, type EnrollmentTone } from "@/lib/enrollment-status";
import { cn } from "@/lib/utils";
import type { EnrollmentDataPoint } from "@/lib/types";

// Chart colours come from the theme's CSS variables (globals.css), never hex.
const toneFill: Record<EnrollmentTone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
};

const chartClass = "aspect-auto h-60 w-full sm:h-80";

function useChartRows(points: EnrollmentDataPoint[]) {
  // Below sm there is room for short labels only ("F26").
  const wide = useMediaQuery("(min-width: 640px)");
  return sortByTerm(points).map((point) => ({ ...point, loadPercent: seatLoadPercent(point), label: termLabel(point, !wide), fullLabel: termLabel(point) }));
}

function ValueRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-text-muted">
        <span aria-hidden="true" className="size-2 rounded-sm" style={{ background: color }} />
        {label}
      </span>
      <span className={numericStyles.base}>{value}</span>
    </div>
  );
}

const loadConfig = { loadPercent: { label: "Load", color: "var(--chart-1)" } } satisfies ChartConfig;

export function LoadChart({ points }: { points: EnrollmentDataPoint[] }) {
  const rows = useChartRows(points);
  return (
    <ChartContainer config={loadConfig} className={chartClass}>
      <BarChart data={rows} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={6} />
        <YAxis domain={[0, 110]} ticks={[0, 25, 50, 75, 100]} allowDataOverflow tickFormatter={(v: number) => `${v}%`} width={40} tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel}
              formatter={(value, _name, item) => (
                <ValueRow label="Load" value={`${displayLoadPercent(Number(value))}%`} color={toneFill[ENROLLMENT_STATUS_TONES[getEnrollmentStatus(Number(value))]] ?? item.color ?? ""} />
              )}
            />
          }
        />
        <ReferenceLine
          y={100}
          stroke="var(--text-muted)"
          strokeDasharray="4 4"
          label={{ value: "100% full", position: "insideTopRight", fill: "var(--text-muted)" }}
        />
        <Bar dataKey="loadPercent" radius={[3, 3, 0, 0]} maxBarSize={36}>
          {rows.map((row) => (
            <Cell key={row.semesterCode} fill={toneFill[ENROLLMENT_STATUS_TONES[getEnrollmentStatus(row.loadPercent)]]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const enrollmentConfig = {
  capacity: { label: "Capacity", color: "var(--border-strong)" },
  enrolled: { label: "Enrolled", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function EnrollmentChart({ points }: { points: EnrollmentDataPoint[] }) {
  const rows = useChartRows(points);
  return (
    <ChartContainer config={enrollmentConfig} className={chartClass}>
      <BarChart data={rows} margin={{ top: 18, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={6} />
        <YAxis allowDecimals={false} width={40} tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel}
              formatter={(value, name) => {
                const key = name as keyof typeof enrollmentConfig;
                return <ValueRow label={enrollmentConfig[key]?.label ?? String(name)} value={String(value)} color={enrollmentConfig[key]?.color ?? ""} />;
              }}
            />
          }
        />
        <Bar dataKey="capacity" fill="var(--surface-raised)" stroke="var(--border-strong)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="enrolled" fill="var(--chart-2)" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}

function Swatch({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-2.5 rounded-sm", className)} />;
}

/** Legends for the chart card header. */
export function ChartLegend({ kind }: { kind: "load" | "enrollment" | "grades" }) {
  const items =
    kind === "load"
      ? [
          { label: "Open", swatch: <Swatch className="bg-success" /> },
          { label: "Almost full", swatch: <Swatch className="bg-warning" /> },
          { label: "Full", swatch: <Swatch className="bg-destructive" /> },
          { label: "100% full", swatch: <span aria-hidden="true" className="inline-block w-3 border-t border-dashed border-text-muted" /> },
        ]
      : kind === "enrollment"
        ? [
            { label: "Capacity", swatch: <Swatch className="border border-border-strong bg-surface-raised" /> },
            { label: "Enrolled", swatch: <Swatch className="bg-chart-2" /> },
          ]
        : [{ label: "Median grade", swatch: <Swatch className="bg-accent" /> }];

  return (
    <ul aria-label="Legend" className={cn(labelStyles.md, "flex flex-wrap items-center gap-x-3 gap-y-1 text-text-muted")}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          {item.swatch}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Visually hidden table of the plotted values: the charts' text alternative. */
export function HistoryDataTable({ kind, points, caption }: { kind: "load" | "enrollment"; points: EnrollmentDataPoint[]; caption: string }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Term</th>
          {kind === "load" ? <th scope="col">Load</th> : (
            <>
              <th scope="col">Enrolled</th>
              <th scope="col">Capacity</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {sortByTerm(points).map((point) => (
          <tr key={point.semesterCode}>
            <th scope="row">{termLabel(point)}</th>
            {kind === "load" ? <td>{`${displayLoadPercent(seatLoadPercent(point))}%`}</td> : (
              <>
                <td>{point.enrolled}</td>
                <td>{point.capacity}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function GradeDataTable({ distribution, caption }: { distribution: Record<string, number>; caption: string }) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  return (
    <table className={cn("sr-only", bodyStyles.sm)}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Grade</th>
          <th scope="col">Students</th>
          <th scope="col">Share</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(distribution).map(([grade, count]) => (
          <tr key={grade}>
            <th scope="row">{grade}</th>
            <td>{count}</td>
            <td>{total > 0 ? `${Math.round((count / total) * 100)}%` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
