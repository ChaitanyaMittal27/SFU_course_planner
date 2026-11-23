"use client";

import { seatLoadPercent } from "@/lib/enrollment-status";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CourseOffering, TermInfo } from "@/lib/types";
import LoadBar from "@/components/enrollment/LoadBar";
import StatusBadge from "@/components/enrollment/StatusBadge";
import { cardTable } from "@/components/course/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bodyStyles, numericStyles } from "@/app/fonts";
import { formatTerm } from "@/lib/course-stats";
import { sectionCode } from "@/lib/course-routes";
import { cn } from "@/lib/utils";

interface OfferingsTableProps {
  /** Rows to show, newest first. */
  offerings: CourseOffering[];
  enrollingTerm: TermInfo | null;
  /** Builds the offering page URL for a term. */
  offeringHref: (offering: CourseOffering) => string;
}

/**
 * Edge-to-edge offerings table for the "Offerings" card. The term link stretches over
 * the whole row (one keyboard stop per row); the chevron shows the row is clickable.
 */
export default function OfferingsTable({ offerings, enrollingTerm, offeringHref }: OfferingsTableProps) {
  if (offerings.length === 0) return null;
  const isEnrolling = (o: CourseOffering) => enrollingTerm !== null && o.semesterCode === enrollingTerm.semesterCode;

  return (
    <Table className="[&_td]:px-2 [&_th]:px-2 sm:[&_td]:px-5 sm:[&_th]:px-5">
      <TableHeader>
        <TableRow className={cardTable.headRow}>
          <TableHead className={cardTable.head}>Term</TableHead>
          <TableHead className={cn(cardTable.head, "hidden sm:table-cell")}>Section</TableHead>
          <TableHead className={cn(cardTable.head, "hidden lg:table-cell")}>Instructor</TableHead>
          <TableHead className={cn(cardTable.head, "hidden lg:table-cell")}>Campus</TableHead>
          <TableHead className={cardTable.head}><span className="sm:hidden">Seats</span><span className="hidden sm:inline">Enrolled / cap</span></TableHead>
          <TableHead className={cardTable.head}>Load</TableHead>
          <TableHead className={cardTable.head}>
            <span className="sr-only">Open</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {offerings.map((o) => (
          <TableRow key={`${o.semesterCode}-${o.section}`} className={cn(cardTable.row, "group relative")}>
            <TableCell className={cardTable.cell}>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={offeringHref(o)}
                  className={cn(
                    bodyStyles.md,
                    "font-medium text-text-primary underline-offset-4 group-hover:underline focus-visible:underline focus-visible:outline-none",
                    // Stretch the link over the row so the whole row is clickable.
                    "after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                  )}
                >
                  {formatTerm(o.term, o.year)}
                </Link>
                {isEnrolling(o) && <StatusBadge status="Enrolling" />}
              </div>
              {/* Below sm the Section column is hidden, so the code sits under the term. */}
              <span className={cn(bodyStyles.sm, "text-text-muted sm:hidden")}>{sectionCode(o.section)}</span>
            </TableCell>
            <TableCell className={cn(cardTable.cell, bodyStyles.md, "hidden text-text-muted sm:table-cell")}>{sectionCode(o.section)}</TableCell>
            <TableCell className={cn(cardTable.cell, bodyStyles.md, "hidden lg:table-cell")}>{o.instructors || "—"}</TableCell>
            <TableCell className={cn(cardTable.cell, bodyStyles.md, "hidden text-text-muted lg:table-cell")}>{o.location || "—"}</TableCell>
            <TableCell className={cn(cardTable.cell, numericStyles.md, "whitespace-normal text-text-primary")}>
              {o.enrolled} / {o.capacity}
            </TableCell>
            <TableCell className={cardTable.cell}>
              <LoadBar percent={seatLoadPercent(o)} tonedLabel className="flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2" />
            </TableCell>
            <TableCell className={cn(cardTable.cell, "w-8 text-text-subtle")}>
              <ChevronRight aria-hidden="true" className="size-4" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
