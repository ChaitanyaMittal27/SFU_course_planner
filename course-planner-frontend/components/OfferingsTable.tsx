"use client";

import type { CourseOffering, TermInfo } from "@/lib/types";
import LoadBar from "@/components/LoadBar";
import StatusBadge from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bodyStyles } from "@/app/fonts";

interface OfferingsTableProps {
  offerings: CourseOffering[];
  enrollingTerm: TermInfo | null;
  onRowClick?: (offering: CourseOffering) => void;
}

function formatTermLabel(term: string, year: number) {
  return `${term.charAt(0).toUpperCase() + term.slice(1)} ${year}`;
}

export default function OfferingsTable({ offerings, enrollingTerm, onRowClick }: OfferingsTableProps) {
  if (offerings.length === 0) return null;

  const isEnrolling = (o: CourseOffering) =>
    !!enrollingTerm &&
    o.term?.toLowerCase() === enrollingTerm.term?.toLowerCase() &&
    o.year === enrollingTerm.year;

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Term</TableHead>
            <TableHead className="hidden sm:table-cell">Section</TableHead>
            <TableHead className="hidden md:table-cell">Instructor</TableHead>
            <TableHead className="hidden lg:table-cell">Campus</TableHead>
            <TableHead>Enrolled / Cap</TableHead>
            <TableHead>Load</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offerings.map((o) => {
            const enrolling = isEnrolling(o);
            return (
            <TableRow
              key={`${o.semesterCode}-${o.section}`}
              onClick={() => onRowClick?.(o)}
              className={`cursor-pointer transition ${enrolling ? "bg-success/5" : ""}`}
            >
              <TableCell>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={bodyStyles.md}>{formatTermLabel(o.term, o.year)}</span>
                  <span className={`sm:hidden ${bodyStyles.sm} text-text-muted`}>· {o.section}</span>
                  {enrolling && <StatusBadge status="Enrolling" />}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <span className={`${bodyStyles.md} text-text-muted`}>{o.section}</span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className={bodyStyles.md}>{o.instructors || "—"}</span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className={`${bodyStyles.md} text-text-muted`}>{o.location || "—"}</span>
              </TableCell>
              <TableCell>
                <span className={bodyStyles.md}>
                  {o.enrolled} / {o.capacity}
                </span>
              </TableCell>
              <TableCell>
                <LoadBar percent={o.loadPercent ?? 0} />
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
