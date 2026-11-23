"use client";

import Link from "next/link";
import CourseSearch from "@/components/course/CourseSearch";
import StatusBadge from "@/components/enrollment/StatusBadge";
import PageContainer from "@/components/layout/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { bodyStyles, displayStyles, labelStyles, numericStyles } from "@/app/fonts";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { cn } from "@/lib/utils";

const headCell = cn(labelStyles.sm, "px-3 py-2 text-left font-medium uppercase tracking-wide text-text-muted");
const cell = cn(bodyStyles.sm, "px-3 py-2.5 text-text-primary");

export default function NotFound() {
  const catalog = useCourseCatalog();

  return (
    <PageContainer className="flex justify-center">
      <div className="w-full max-w-[35rem] rounded-lg border border-border bg-surface p-6 sm:p-8">
        <p className={cn(numericStyles.display, "text-text-subtle")} aria-hidden="true">
          404
        </p>
        <h1 className={cn(displayStyles.sm, "mt-3 text-text-primary")}>This page isn&apos;t offered this term.</h1>
        <p className={cn(bodyStyles.lg, "mt-2 text-text-muted")}>Or any term, really. Even the waitlist is empty.</p>

        {/* The joke: a course-listing row for this page. */}
        <div className="mt-6 overflow-x-auto rounded-md border border-border">
          <table className="w-full">
            <caption className="sr-only">This page as a course offering</caption>
            <thead className="bg-surface-raised">
              <tr>
                <th scope="col" className={headCell}>Section</th>
                <th scope="col" className={cn(headCell, "hidden sm:table-cell")}>Title</th>
                <th scope="col" className={cn(headCell, "hidden sm:table-cell")}>Seats</th>
                <th scope="col" className={headCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className={cn(cell, numericStyles.sm, "font-semibold")}>PAGE 404</td>
                <td className={cn(cell, "hidden sm:table-cell")}>Page Not Found</td>
                <td className={cn(cell, numericStyles.sm, "hidden sm:table-cell")}>0 / 0</td>
                <td className={cell}>
                  <StatusBadge status="Not offered" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <CourseSearch catalog={catalog} label="What were you looking for?" className="mt-6" />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/browse" className={buttonVariants({ size: "lg", className: "px-4" })}>
            Browse courses
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "lg", className: "px-4" })}>
            Go home
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
