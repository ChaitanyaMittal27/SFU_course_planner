"use client";

import { X } from "lucide-react";
import { CourseOffering, Bookmark, Course } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadBar from "@/components/LoadBar";
import StatusBadge from "@/components/StatusBadge";
import { headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

interface BookmarksTableProps {
  offerings: CourseOffering[];
  bookmarks: Bookmark[];
  courses: Map<number, Course>;
  onDelete: (bookmarkId: number) => void;
  onRowClick: (offering: CourseOffering, bookmark: Bookmark) => void;
}

export default function BookmarksTable({
  offerings,
  bookmarks,
  courses,
  onDelete,
  onRowClick,
}: BookmarksTableProps) {
  const getBookmark = (offering: CourseOffering): Bookmark | null =>
    bookmarks.find(
      (b) => b.semesterCode === offering.semesterCode && b.section === offering.section
    ) ?? null;

  const getCourseInfo = (bookmark: Bookmark) => {
    const course = courses.get(bookmark.courseId);
    if (!course) return null;
    return { courseNumber: course.courseNumber, title: course.title };
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={`${labelStyles.md} text-text-muted`}>Course</TableHead>
              <TableHead className={`${labelStyles.md} text-text-muted`}>Section</TableHead>
              <TableHead className={`${labelStyles.md} text-text-muted`}>Term</TableHead>
              <TableHead className={`${labelStyles.md} text-text-muted`}>Campus</TableHead>
              <TableHead className={`${labelStyles.md} text-text-muted`}>Instructor</TableHead>
              <TableHead className={`${labelStyles.md} text-text-muted text-right`}>Enrolled</TableHead>
              <TableHead className={`${labelStyles.md} text-text-muted text-right`}>Capacity</TableHead>
              <TableHead className={`${labelStyles.md} text-text-muted text-right`}>Load</TableHead>
              <TableHead className={`${labelStyles.md} text-text-muted text-center`}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offerings.map((offering) => {
              const bookmark = getBookmark(offering);
              if (!bookmark) return null;

              const courseInfo = getCourseInfo(bookmark);

              return (
                <TableRow
                  key={`${offering.semesterCode}-${offering.section}`}
                  className="cursor-pointer"
                  onClick={() => onRowClick(offering, bookmark)}
                >
                  <TableCell>
                    {courseInfo ? (
                      <div>
                        <div className={`${headerStyles.sm} text-text-primary`}>
                          {courseInfo.courseNumber}
                        </div>
                        <div className={`${bodyStyles.md} text-text-muted truncate max-w-xs`}>
                          {courseInfo.title}
                        </div>
                      </div>
                    ) : (
                      <span className="text-text-subtle">Loading...</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className={`${headerStyles.sm} text-text-primary`}>
                      {offering.section}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className={bodyStyles.md}>
                      <div className="text-text-primary font-medium">
                        {offering.term} {offering.year}
                      </div>
                      {offering.isEnrolling && (
                        <StatusBadge status="Enrolling" className="mt-1" />
                      )}
                    </div>
                  </TableCell>

                  <TableCell className={`${bodyStyles.md} text-text-muted`}>
                    {offering.location}
                  </TableCell>

                  <TableCell className={`${bodyStyles.md} text-text-muted`}>
                    {offering.instructors || "TBA"}
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="text-text-primary font-medium">{offering.enrolled}</span>
                  </TableCell>

                  <TableCell className={`${bodyStyles.md} text-text-muted text-right`}>
                    {offering.capacity}
                  </TableCell>

                  <TableCell className="text-right">
                    <LoadBar percent={offering.loadPercent} />
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bookmark.bookmarkId);
                      }}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Remove bookmark"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-border px-6 py-4 bg-surface">
        <p className={`${bodyStyles.md} text-text-muted`}>
          <span className="text-text-primary font-semibold">{offerings.length}</span>{" "}
          bookmarked {offerings.length === 1 ? "section" : "sections"}
        </p>
      </div>
    </Card>
  );
}
