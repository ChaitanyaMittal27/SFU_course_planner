"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { bodyStyles, headerStyles, labelStyles } from "@/app/fonts";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import InstructorRatings from "@/components/course/InstructorRatings";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { api, type CourseOffering } from "@/lib/api";
import { sectionCode } from "@/lib/course-routes";
import type { ResolvedCourseRoute } from "@/lib/course-resolver";

type SectionComparisonResultsProps = {
  course: ResolvedCourseRoute;
  semesterCode: number;
  requestedSections: string[];
  onSectionsChange: (sections: string[]) => void;
};

function normalizeSelectedSections(sections: string[], availableSections: CourseOffering[]) {
  const availableCodes = new Set(availableSections.map((section) => sectionCode(section.section)));
  return [...new Set(sections.map(sectionCode).filter((code) => availableCodes.has(code)))].slice(0, 3);
}

export default function SectionComparisonResults({
  course,
  semesterCode,
  requestedSections,
  onSectionsChange,
}: SectionComparisonResultsProps) {
  const [availableSections, setAvailableSections] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void api
      .getOfferingDetail(course.deptId, course.courseId, semesterCode)
      .then((offering) => {
        if (!active) return;
        setError(null);
        setAvailableSections(offering.sections);
      })
      .catch(() => {
        if (!active) return;
        setAvailableSections([]);
        setError("This course is not offered in the selected term.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [course.courseId, course.deptId, semesterCode]);

  const selectedSections = normalizeSelectedSections(requestedSections, availableSections);
  const comparisonSections = useMemo(
    () => availableSections.filter((section) => selectedSections.includes(sectionCode(section.section))),
    [availableSections, selectedSections],
  );

  const toggleSection = (section: string) => {
    const code = sectionCode(section);
    const nextSections = selectedSections.includes(code)
      ? selectedSections.filter((selected) => selected !== code)
      : selectedSections.length < 3
        ? [...selectedSections, code]
        : selectedSections;

    if (nextSections.length === selectedSections.length && !selectedSections.includes(code)) {
      setError("You can compare up to three sections at a time.");
      return;
    }

    setError(null);
    onSectionsChange(nextSections);
  };

  if (loading) return <LoadingSpinner />;
  if (error && availableSections.length === 0) return <ErrorMessage message={error} />;

  return (
    <>
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {availableSections.length > 0 && (
        <Card className="mb-6 p-5 sm:mb-8 sm:p-6">
          <CardContent className="p-0">
            <h2 className={`${headerStyles.md} mb-2 text-text-primary`}>
              Available Sections ({availableSections.length})
            </h2>
            <p className={`${bodyStyles.md} mb-4 text-text-muted`}>
              Select two or three sections to compare. Selected: {selectedSections.length}/3
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableSections.map((section) => {
                const code = sectionCode(section.section);
                const isSelected = selectedSections.includes(code);

                return (
                  <button
                    key={section.section}
                    type="button"
                    onClick={() => toggleSection(section.section)}
                    aria-pressed={isSelected}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      isSelected ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className={`${labelStyles.lg} mb-1 text-text-primary`}>{section.section}</div>
                    <div className={`${bodyStyles.md} text-text-muted`}>{section.instructors}</div>
                    <div className={`${bodyStyles.sm} mt-2 text-text-subtle`}>
                      {section.enrolled}/{section.capacity} • {section.loadPercent}% full
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonSections.length >= 2 && (
        <Card className="p-5 sm:p-6">
          <CardContent className="p-0">
            <h2 className={`${headerStyles.lg} mb-6 text-text-primary`}>Section Comparison</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableBody>
                  <ComparisonRow label="Section">
                    {comparisonSections.map((section) => (
                      <TableCell key={section.section} className={`${headerStyles.sm} text-text-primary`}>
                        {section.section}
                      </TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Instructor">
                    {comparisonSections.map((section) => (
                      <TableCell key={section.section} className="text-text-primary">
                        {section.instructors}
                      </TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Campus">
                    {comparisonSections.map((section) => (
                      <TableCell key={section.section} className="text-text-primary">
                        {section.location}
                      </TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Enrollment">
                    {comparisonSections.map((section) => (
                      <TableCell key={section.section} className="text-text-primary">
                        {section.enrolled} / {section.capacity}
                      </TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Capacity Used">
                    {comparisonSections.map((section) => (
                      <TableCell key={section.section}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-grow rounded-full bg-surface-raised">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                              style={{ width: `${Math.min(section.loadPercent, 100)}%` }}
                            />
                          </div>
                          <span className={`${labelStyles.md} text-text-primary`}>{section.loadPercent}%</span>
                        </div>
                      </TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="CourseSys Link">
                    {comparisonSections.map((section) => (
                      <TableCell key={section.section}>
                        <a
                          href={`https://coursys.sfu.ca${section.infoUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-accent hover:underline ${bodyStyles.md}`}
                        >
                          View Details →
                        </a>
                      </TableCell>
                    ))}
                  </ComparisonRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonSections.length >= 2 && (
        <Card className="mt-6 p-5 sm:p-6">
          <CardContent className="p-0">
            <InstructorRatings sections={comparisonSections} deptCode={course.deptCode} />
          </CardContent>
        </Card>
      )}

      {availableSections.length === 0 && !error && (
        <TaskEmptyState
          icon={ClipboardList}
          title="No sections available"
          description="There are no sections to compare for this course and term."
        />
      )}
      {availableSections.length > 0 && selectedSections.length < 2 && (
        <TaskEmptyState
          icon={ClipboardList}
          title="Select one more section"
          description="Choose at least two sections from the list above to compare them side by side."
        />
      )}
    </>
  );
}

function ComparisonRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow className="border-b border-border">
      <TableCell className={`w-1/5 font-medium text-text-muted ${bodyStyles.md}`}>{label}</TableCell>
      {children}
    </TableRow>
  );
}
