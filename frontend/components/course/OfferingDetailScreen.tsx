"use client";

import { useRouter } from "next/navigation";
import GradeHistogram from "@/components/analytics/GradeHistogram";
import BookmarkButton from "@/components/course/BookmarkButton";
import InstructorRatings from "@/components/course/InstructorRatings";
import BackButton from "@/components/layout/BackButton";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OfferingDetail } from "@/lib/types";
import { bodyStyles, headerStyles, labelStyles } from "@/app/fonts";

interface OfferingDetailScreenProps {
  detail: OfferingDetail;
  backHref: string;
}

function extractSection(section: string) {
  const parts = section.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

export default function OfferingDetailScreen({ detail, backHref }: OfferingDetailScreenProps) {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BackButton onClick={() => router.push(backHref)} label="Back to offerings" className="mb-6" />

      <Card className="p-6 rounded-2xl">
        <div className="flex flex-col gap-1">
          <div className={`${bodyStyles.md} text-text-muted`}>
            {detail.deptCode.toUpperCase()} {detail.courseNumber}
          </div>
          <div className={`${headerStyles.lg} text-text-primary`}>{detail.title}</div>
          <div className={`${bodyStyles.md} text-text-muted`}>
            {detail.term} {detail.year}
            {detail.campus ? ` • ${detail.campus}` : ""}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Units", value: detail.units },
            { label: "Median Grade", value: detail.medianGrade ?? "N/A" },
            {
              label: "Fail Rate",
              value: Number.isFinite(detail.failRate) ? `${detail.failRate.toFixed(2)}%` : "N/A",
            },
          ].map(({ label, value }) => (
            <div key={label} className="border rounded-xl p-4 border-border/50">
              <div className={`${bodyStyles.sm} text-text-subtle`}>{label}</div>
              <div className={`${headerStyles.md} text-text-primary`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {detail.degreeLevel && (
            <span className="inline-flex items-center px-3 py-2 rounded-lg bg-surface-raised text-text-primary text-sm">
              {detail.degreeLevel}
            </span>
          )}
          {detail.designation && (
            <span className="inline-flex items-center px-3 py-2 rounded-lg bg-surface-raised text-text-primary text-sm">
              {detail.designation}
            </span>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {detail.description && (
            <div>
              <div className={`${labelStyles.lg} text-text-primary mb-1`}>Description</div>
              <p className={`${bodyStyles.md} text-text-muted leading-relaxed`}>{detail.description}</p>
            </div>
          )}

          {(detail.prerequisites || detail.corequisites) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4 border-border/50">
                <div className={`${labelStyles.lg} text-text-primary mb-1`}>Prerequisites</div>
                <p className={`${bodyStyles.md} text-text-muted`}>{detail.prerequisites ?? "None"}</p>
              </div>
              <div className="border rounded-xl p-4 border-border/50">
                <div className={`${labelStyles.lg} text-text-primary mb-1`}>Corequisites</div>
                <p className={`${bodyStyles.md} text-text-muted`}>{detail.corequisites ?? "None"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className={`${headerStyles.md} text-text-primary mb-3`}>Sections</div>
          {detail.sections.length === 0 ? (
            <div className={`${bodyStyles.md} text-text-muted`}>No section data found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Load</TableHead>
                    <TableHead>Jump to Outline</TableHead>
                    <TableHead className="text-center">Bookmark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.sections.map((section) => (
                    <TableRow key={section.section} className="cursor-default">
                      <TableCell>{section.section}</TableCell>
                      <TableCell>{section.instructors || "—"}</TableCell>
                      <TableCell>{section.location || "—"}</TableCell>
                      <TableCell>{section.enrolled}</TableCell>
                      <TableCell>{section.capacity}</TableCell>
                      <TableCell>{section.loadPercent ?? 0}%</TableCell>
                      <TableCell>
                        <a
                          href={`https://www.sfu.ca/outlines.html?${detail.year}/${detail.term.toLowerCase()}/${detail.deptCode.toLowerCase()}/${detail.courseNumber.toLowerCase()}/${extractSection(section.section)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline"
                        >
                          Open outline
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <BookmarkButton
                          deptId={detail.deptId}
                          courseId={detail.courseId}
                          semesterCode={section.semesterCode}
                          section={section.section}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {detail.sections.length > 0 && (
          <div className="mt-8">
            <InstructorRatings sections={detail.sections} deptCode={detail.deptCode} />
          </div>
        )}

        {detail.gradeDistribution && (
          <div className="mt-8">
            <div className={`${headerStyles.md} text-text-primary mb-3`}>Grade Distribution</div>
            <GradeHistogram distribution={detail.gradeDistribution} />
            <p className={`mt-2 ${bodyStyles.sm} text-text-subtle`}>
              Based on Coursediggers data. For more information refer to{" "}
              <a
                href="https://coursediggers.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Coursediggers
              </a>
              .
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
