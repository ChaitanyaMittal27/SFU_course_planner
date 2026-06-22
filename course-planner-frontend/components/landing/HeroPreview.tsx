"use client";

import { Search } from "lucide-react";
import { labelStyles, bodyStyles } from "@/app/fonts";

// TODO: replace with API data from /api/courses/[courseId]/sections
const previewData = {
  course: "CMPT 213",
  title: "Object-Oriented Design in Java",
  rows: [
    { term: "Spring 26", section: "D100", enrolled: 88, capacity: 120, status: "enrolling" as const },
    { term: "Fall 25", section: "D100", enrolled: 120, capacity: 120, status: "full" as const },
    { term: "Spring 25", section: "D100", enrolled: 104, capacity: 130, status: "past" as const },
  ],
};

function getLoadColor(pct: number) {
  if (pct >= 100) return "bg-primary";
  if (pct >= 75) return "bg-warning";
  return "bg-success";
}

export default function HeroPreview() {
  return (
    <div className="rounded-[14px] bg-surface border border-border shadow-[0_16px_50px_rgba(0,0,0,0.25)] overflow-hidden">
      {/* Titlebar */}
      <div className="flex items-center gap-2 px-3.5 py-[11px] border-b border-border">
        <span className="w-2.5 h-2.5 rounded-full bg-border-strong" />
        <span className="w-2.5 h-2.5 rounded-full bg-border-strong" />
        <span className="w-2.5 h-2.5 rounded-full bg-border-strong" />
        <div className="ml-2 flex-1 flex items-center gap-2 px-[11px] py-[5px] rounded-[7px] bg-background border border-border">
          <Search className="w-[13px] h-[13px] text-text-subtle" />
          <span className={`${bodyStyles.sm} text-text-subtle`}>CMPT 213</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 pb-[18px]">
        <div className="flex items-baseline justify-between mb-[3px]">
          <span className="font-display font-semibold text-[15px] text-text-primary">
            {previewData.course}
          </span>
          <span className={`${labelStyles.sm} text-text-subtle`}>
            {previewData.rows.length + 1} offerings
          </span>
        </div>
        <p className={`${bodyStyles.sm} text-text-muted mb-3.5`}>{previewData.title}</p>

        {/* Table */}
        <div className="border border-border rounded-[10px] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1.3fr_0.8fr_1fr_1.1fr] gap-2 px-[13px] py-[9px] bg-background">
            {["Term", "Section", "Enrolled", "Load"].map((h) => (
              <span key={h} className="text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle">
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {previewData.rows.map((row) => {
            const pct = Math.round((row.enrolled / row.capacity) * 100);
            const isEnrolling = row.status === "enrolling";

            return (
              <div
                key={`${row.term}-${row.section}`}
                className={`grid grid-cols-[1.3fr_0.8fr_1fr_1.1fr] gap-2 px-[13px] py-[11px] items-center border-t border-border ${
                  isEnrolling ? "bg-success/[0.09]" : ""
                }`}
              >
                <span className="flex items-center gap-1.5 text-[12.5px] text-text-primary">
                  {row.term}
                  {isEnrolling && (
                    <span className="text-[9.5px] font-semibold px-1.5 py-[2px] rounded-full bg-success/[0.16] text-success">
                      ENROLLING
                    </span>
                  )}
                </span>
                <span className={`${bodyStyles.sm} text-text-muted`}>{row.section}</span>
                <span className="text-[12.5px] text-text-primary">
                  {row.enrolled} / {row.capacity}
                </span>
                <span className="flex items-center gap-[7px]">
                  <span className="flex-1 h-[5px] rounded-[3px] bg-surface-raised overflow-hidden">
                    <span
                      className={`block h-full ${getLoadColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className={`${labelStyles.sm} text-text-muted`}>{pct}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
