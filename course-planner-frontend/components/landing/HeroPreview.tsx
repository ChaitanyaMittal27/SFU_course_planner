"use client";

import { Calendar } from "lucide-react";
import { headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

// TODO: replace with API data from /api/bookmarks/offerings
const previewData = {
  date: "July 5, 2026",
  rows: [
    {
      section: "CMPT 372 D100",
      title: "Web II – Server-side",
      enrolled: "116 / 150",
      status: "Open",
      statusColor: "text-success",
    },
    {
      section: "CMPT 210 B100",
      title: "Probability & Computing",
      enrolled: "91 / 100 (+1)",
      status: "Almost Full",
      statusColor: "text-accent",
    },
  ],
};

export default function HeroPreview() {
  return (
    <div className="rounded-[14px] bg-surface border border-border shadow-[0_16px_50px_rgba(0,0,0,0.25)] overflow-hidden">
      {/* Subject + inbox tabs */}
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <h3 className={`${headerStyles.xs} text-text-primary mb-2.5`}>
          SFU Course Planner — Daily Enrollment Update
        </h3>
        <div className="flex items-center gap-2">
          <span className={`${labelStyles.sm} font-semibold text-text-primary bg-surface-raised px-2.5 py-1 rounded-md`}>
            Inbox
          </span>
          <span className={`${labelStyles.sm} text-text-subtle px-2.5 py-1`}>My Inbox</span>
        </div>
      </div>

      {/* Sender row */}
      <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Calendar className="w-[18px] h-[18px] text-primary-foreground" />
          </div>
          <div>
            <div className={`${bodyStyles.sm} text-text-primary`}>
              <span className="font-semibold">SFU Course Planner</span>{" "}
              <span className="text-text-subtle">&lt;notifications@sfucourseplanner.com&gt;</span>
            </div>
            <div className={`${labelStyles.sm} text-text-subtle`}>to me</div>
          </div>
        </div>
        <span className={`${labelStyles.sm} text-text-subtle whitespace-nowrap`}>12:05 AM</span>
      </div>

      {/* Email body */}
      <div className="p-5 bg-background">
        <div className="rounded-[10px] bg-surface border border-border shadow-[0_2px_10px_rgba(0,0,0,0.08)] p-6">
          {/* Logo */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-11 h-11 rounded-[11px] bg-primary flex items-center justify-center mb-2.5">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className={`${headerStyles.xs} text-text-primary`}>SFU Course Planner</span>
          </div>
          <div className="h-px bg-border mb-5" />

          {/* Heading */}
          <h4 className={`${headerStyles.md} text-text-primary mb-1`}>Enrollment Update</h4>
          <p className={`${labelStyles.sm} text-text-subtle mb-4`}>{previewData.date}</p>

          {/* Table */}
          <div className="border border-border rounded-[10px] overflow-hidden">
            <div className="grid grid-cols-[1.1fr_1.5fr_1fr_1fr] gap-2 px-3.5 py-2 bg-background">
              {["Section", "Title", "Enrolled", "Status"].map((h) => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
                  {h}
                </span>
              ))}
            </div>
            {previewData.rows.map((row) => (
              <div
                key={row.section}
                className="grid grid-cols-[1.1fr_1.5fr_1fr_1fr] gap-2 px-3.5 py-2.5 items-center border-t border-border"
              >
                <span className="text-[12px] font-semibold text-text-primary">{row.section}</span>
                <span className="text-[12px] text-text-muted">{row.title}</span>
                <span className="text-[12px] text-text-primary">{row.enrolled}</span>
                <span className={`text-[11px] font-semibold ${row.statusColor}`}>{row.status}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className={`${labelStyles.sm} text-text-subtle text-center mt-4`}>
            Manage your bookmarks at <span className="text-primary font-medium">sfucourseplanner.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
