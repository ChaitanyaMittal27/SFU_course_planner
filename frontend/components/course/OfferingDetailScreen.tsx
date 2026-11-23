"use client";

import { ExternalLink } from "lucide-react";
import GradeHistogram from "@/components/analytics/GradeHistogram";
import BookmarkButton from "@/components/course/BookmarkButton";
import CourseBreadcrumb from "@/components/course/CourseBreadcrumb";
import InstructorRatings from "@/components/course/InstructorRatings";
import SectionCard, { cardClass, cardPadding, cardTable } from "@/components/course/SectionCard";
import SummaryRow from "@/components/course/SummaryRow";
import StatusBadge from "@/components/enrollment/StatusBadge";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bodyStyles, headerStyles, numericStyles } from "@/app/fonts";
import { useSectionBookmarks } from "@/hooks/useSectionBookmarks";
import { sectionCode } from "@/lib/course-routes";
import { formatCourseCode, formatPercent, formatTerm, sumSeats } from "@/lib/course-stats";
import { cn } from "@/lib/utils";
import type { OfferingDetail } from "@/lib/types";

interface OfferingDetailScreenProps {
  detail: OfferingDetail;
  /** The course page this offering belongs to. */
  backHref: string;
}

function outlineHref(detail: OfferingDetail, section: string) {
  return `https://www.sfu.ca/outlines.html?${detail.year}/${detail.term.toLowerCase()}/${detail.deptCode.toLowerCase()}/${detail.courseNumber.toLowerCase()}/${sectionCode(section).toLowerCase()}`;
}

export default function OfferingDetailScreen({ detail, backHref }: OfferingDetailScreenProps) {
  const bookmarks = useSectionBookmarks();
  const code = formatCourseCode(detail.deptCode, detail.courseNumber);
  const term = formatTerm(detail.term, detail.year);
  const seats = sumSeats(detail.sections);
  const sectionCount = detail.sections.length;
  const description = [term, detail.units ? `${detail.units} units` : null, `${sectionCount} ${sectionCount === 1 ? "section" : "sections"}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageContainer>
      <CourseBreadcrumb items={[{ label: "Browse", href: "/browse" }, { label: code, href: backHref }, { label: term }]} />
      <PageHeader
        title={
          <>
            <span className={numericStyles.base}>{code}</span>
            {detail.title ? ` · ${detail.title}` : ""}
          </>
        }
        description={description}
      />

      <SummaryRow
        items={[
          { label: "Seats taken", value: seats ? `${seats.enrolled} / ${seats.capacity}` : null },
          { label: "Median grade", value: detail.medianGrade || null },
          { label: "Fail rate", value: detail.medianGrade || detail.gradeDistribution ? formatPercent(detail.failRate) : null },
        ]}
      >
        {detail.designation && <Badge variant="outline">{detail.designation}</Badge>}
        {detail.degreeLevel && <Badge variant="outline">{detail.degreeLevel}</Badge>}
      </SummaryRow>

      <div className="space-y-6">
        <SectionCard
          title="Sections"
          note={sectionCount > 0 ? "Bookmarked sections are included in your morning email" : undefined}
          flush={sectionCount > 0}
        >
          {sectionCount === 0 ? (
            <p className={cn(bodyStyles.md, "text-text-muted")}>No section data found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={cardTable.headRow}>
                  <TableHead className={cardTable.head}>Section</TableHead>
                  <TableHead className={cardTable.head}>Instructor</TableHead>
                  <TableHead className={cn(cardTable.head, "hidden md:table-cell")}>Campus</TableHead>
                  <TableHead className={cardTable.head}>Enrolled / cap</TableHead>
                  <TableHead className={cardTable.head}>Status</TableHead>
                  <TableHead className={cardTable.head}>Outline</TableHead>
                  <TableHead className={cardTable.head}>
                    <span className="sr-only">Bookmark</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.sections.map((section) => {
                  const short = sectionCode(section.section);
                  return (
                    <TableRow key={section.section} className={cardTable.row}>
                      <TableCell className={cn(cardTable.cell, numericStyles.md, "font-medium text-text-primary")}>{short}</TableCell>
                      <TableCell className={cn(cardTable.cell, bodyStyles.md)}>{section.instructors || "—"}</TableCell>
                      <TableCell className={cn(cardTable.cell, bodyStyles.md, "hidden text-text-muted md:table-cell")}>{section.location || "—"}</TableCell>
                      <TableCell className={cn(cardTable.cell, numericStyles.md, "text-text-primary")}>
                        {section.enrolled} / {section.capacity}
                      </TableCell>
                      <TableCell className={cardTable.cell}>
                        <StatusBadge loadPercent={section.loadPercent ?? 0} />
                      </TableCell>
                      <TableCell className={cardTable.cell}>
                        <a
                          href={outlineHref(detail, section.section)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Outline for ${short} (opens in a new tab)`}
                          className={cn(bodyStyles.sm, "inline-flex items-center gap-1 text-accent-text hover:underline")}
                        >
                          Outline
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      </TableCell>
                      <TableCell className={cn(cardTable.cell, "text-right")}>
                        <BookmarkButton
                          bookmarks={bookmarks}
                          label={`${code} ${short}`}
                          deptId={detail.deptId}
                          courseId={detail.courseId}
                          semesterCode={section.semesterCode}
                          section={section.section}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        {(sectionCount > 0 || detail.gradeDistribution) && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            {sectionCount > 0 && <InstructorRatings sections={detail.sections} deptCode={detail.deptCode} variant="card" />}
            {detail.gradeDistribution && (
              <SectionCard
                title="Grade distribution"
                note={
                  <>
                    All terms ·{" "}
                    <a href="https://coursediggers.com" target="_blank" rel="noopener noreferrer" className="text-accent-text hover:underline">
                      CourseDiggers
                    </a>
                  </>
                }
              >
                <GradeHistogram distribution={detail.gradeDistribution} medianGrade={detail.medianGrade} failRate={detail.failRate} />
              </SectionCard>
            )}
          </div>
        )}

        {(detail.description || detail.prerequisites || detail.corequisites) && (
          <div className={cn(cardClass, "grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0")}>
            <section aria-labelledby="description-heading" className={cardPadding}>
              <h2 id="description-heading" className={cn(headerStyles.md, "mb-2 text-text-primary")}>
                Description
              </h2>
              <p className={cn(bodyStyles.md, "text-text-muted")}>{detail.description || "No description available."}</p>
            </section>
            <section aria-labelledby="prereq-heading" className={cardPadding}>
              <h2 id="prereq-heading" className={cn(headerStyles.md, "mb-2 text-text-primary")}>
                Prerequisites
              </h2>
              <p className={cn(bodyStyles.md, "text-text-muted")}>{detail.prerequisites || "None listed."}</p>
              {detail.corequisites && (
                <p className={cn(bodyStyles.md, "mt-3 text-text-muted")}>
                  <span className="font-medium text-text-primary">Corequisites: </span>
                  {detail.corequisites}
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
