"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { BarChart2 } from "lucide-react";
import AnalyticsCourseSelector from "@/components/analytics/AnalyticsCourseSelector";
import GradeHistogram from "@/components/analytics/GradeHistogram";
import { ChartLegend, EnrollmentChart, GradeDataTable, HistoryDataTable, LoadChart } from "@/components/analytics/HistoryCharts";
import SectionCard from "@/components/course/SectionCard";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { ChartAreaSkeleton } from "@/components/feedback/Skeletons";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import RouteTabs from "@/components/layout/RouteTabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { bodyStyles } from "@/app/fonts";
import { api } from "@/lib/api";
import { enrollmentSummary, gradesSummary, loadSummary } from "@/lib/analytics-summary";
import { graphCourseHref, normalizeCourseIdentity } from "@/lib/course-routes";
import { resolveCourseIdentity, type ResolvedCourseRoute } from "@/lib/course-resolver";
import { formatCourseCode } from "@/lib/course-stats";
import { cn } from "@/lib/utils";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import type { Course, Department, EnrollmentDataPoint, GradeDistribution } from "@/lib/types";

export type AnalyticsKind = "load" | "enrollment" | "grades";

export const RANGES = [
  { value: "1yr", label: "1 year" },
  { value: "3yr", label: "3 years" },
  { value: "5yr", label: "5 years" },
] as const;
const DEFAULT_RANGE = "5yr";

const content: Record<AnalyticsKind, { tab: string; chart: string; description: string }> = {
  load: { tab: "Load", chart: "Load over time", description: "How full the course was each term, as a share of its seats." },
  enrollment: { tab: "Enrollment", chart: "Enrollment vs capacity", description: "Enrolled students against total seats, term by term." },
  grades: { tab: "Grades", chart: "Grade distribution", description: "Historical grades for the course, from CourseDiggers." },
};

const KINDS: AnalyticsKind[] = ["load", "enrollment", "grades"];

function sortCourses(courses: Course[]) {
  return [...courses].sort((a, b) => a.courseNumber.localeCompare(b.courseNumber, undefined, { numeric: true }));
}

/**
 * The graphs page for one chart type. With /graph/{kind}/{DEPT}/{NUM} it shows that
 * course; on /graph/{kind} (no course in the URL) it shows the pickers and an empty card.
 */
export default function CanonicalAnalyticsPage({ kind }: { kind: AnalyticsKind }) {
  const params = useParams<{ deptCode?: string; courseNumber?: string }>();
  const router = useRouter();
  const [rangeParam, setRange] = useQueryState("range", { defaultValue: DEFAULT_RANGE });
  const range = RANGES.some((r) => r.value === rangeParam) ? rangeParam : DEFAULT_RANGE;

  const deptCode = params?.deptCode ?? "";
  const courseNumber = params?.courseNumber ?? "";
  const hasCourseInUrl = Boolean(deptCode || courseNumber);
  const identity = useMemo(
    () => (hasCourseInUrl ? normalizeCourseIdentity(deptCode, courseNumber) : null),
    [hasCourseInUrl, deptCode, courseNumber],
  );
  const identityKey = identity ? `${identity.deptCode}/${identity.courseNumber}` : "";

  const resolveRequest = useRetryableRequest();
  const dataRequest = useRetryableRequest();
  const departmentsRequest = useRetryableRequest();

  const [departmentsResult, setDepartmentsResult] = useState<{ attempt: number; data: Department[] | null } | null>(null);
  const [resolution, setResolution] = useState<{ key: string; course: ResolvedCourseRoute | null; failed: boolean } | null>(null);
  const [pickedDeptId, setPickedDeptId] = useState<string | null>(null);
  const [coursesResult, setCoursesResult] = useState<{ key: string; data: Course[] | null } | null>(null);
  const [dataResult, setDataResult] = useState<{ key: string; data: GradeDistribution | EnrollmentDataPoint[] | null } | null>(null);

  useEffect(() => {
    let active = true;
    const attempt = departmentsRequest.requestVersion;
    api
      .getDepartments()
      .then((data) => active && setDepartmentsResult({ attempt, data: [...data].sort((a, b) => a.deptCode.localeCompare(b.deptCode)) }))
      .catch(() => active && setDepartmentsResult({ attempt, data: null }));
    return () => {
      active = false;
    };
  }, [departmentsRequest.requestVersion]);

  const resolutionKey = identity ? `${identityKey}#${resolveRequest.requestVersion}` : "";
  useEffect(() => {
    if (!identity) return;
    let active = true;
    const key = resolutionKey;
    resolveCourseIdentity(identity)
      .then((course) => active && setResolution({ key, course, failed: false }))
      .catch(() => active && setResolution({ key, course: null, failed: true }));
    return () => {
      active = false;
    };
    // identity is captured through resolutionKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolutionKey]);

  const settledResolution = resolution?.key === resolutionKey ? resolution : null;
  const resolved = settledResolution?.course ?? null;

  const deptId = pickedDeptId ?? (resolved ? String(resolved.deptId) : "");
  const coursesKey = deptId ? `${deptId}` : "";
  useEffect(() => {
    if (!coursesKey) return;
    let active = true;
    const key = coursesKey;
    api
      .getCourses(Number(key))
      .then((data) => active && setCoursesResult({ key, data: sortCourses(data) }))
      .catch(() => active && setCoursesResult({ key, data: [] }));
    return () => {
      active = false;
    };
  }, [coursesKey]);

  const dataKey = resolved ? `${kind}/${resolved.courseId}/${kind === "grades" ? "" : range}#${dataRequest.requestVersion}` : "";
  useEffect(() => {
    if (!resolved) return;
    let active = true;
    const key = dataKey;
    const request: Promise<GradeDistribution | EnrollmentDataPoint[]> =
      kind === "grades" ? api.getGradeDistribution(resolved.courseId) : api.getEnrollmentHistory(resolved.deptId, resolved.courseId, range);
    request
      .then((data) => active && setDataResult({ key, data }))
      .catch(() => active && setDataResult({ key, data: null }));
    return () => {
      active = false;
    };
    // resolved, kind and range are captured through dataKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  const departments = departmentsResult?.data ?? [];
  const courses = coursesResult?.key === coursesKey ? coursesResult.data : null;
  const settledData = dataResult?.key === dataKey ? dataResult : null;
  const courseValue = resolved && deptId === String(resolved.deptId) ? String(resolved.courseId) : "";
  const showRange = kind !== "grades";

  const hrefFor = (target: AnalyticsKind) => {
    const rangeOption = target !== "grades" && range !== DEFAULT_RANGE ? { range } : undefined;
    return identity ? graphCourseHref(target, identity.deptCode, identity.courseNumber, rangeOption) : graphCourseHref(target, "", "", rangeOption);
  };

  const handleCourseChange = (value: string) => {
    const department = departments.find((item) => String(item.deptId) === deptId);
    const course = courses?.find((item) => String(item.courseId) === value);
    if (department && course) {
      router.push(graphCourseHref(kind, department.deptCode, course.courseNumber, showRange && range !== DEFAULT_RANGE ? { range } : undefined));
    }
  };

  const code = resolved ? formatCourseCode(resolved.department.deptCode, resolved.course.courseNumber) : "";

  const body = (() => {
    if (hasCourseInUrl && !identity) {
      return <ErrorMessage title="Invalid graph link" message="This analytics link is invalid." />;
    }
    if (!identity) {
      return (
        <SectionCard title={content[kind].chart}>
          <TaskEmptyState icon={BarChart2} title="Pick a course to see its history." description="Choose a department and course above." />
        </SectionCard>
      );
    }
    if (settledResolution?.failed) {
      return <ErrorMessage title="Couldn't load this course" message="Failed to resolve this course link." onRetry={resolveRequest.retry} />;
    }
    if (settledResolution && !resolved) {
      return <ErrorMessage title="Course not found" message="This course could not be found." />;
    }
    if (!resolved || !settledData) {
      return (
        <SectionCard title={code ? `${code} · ${content[kind].chart}` : content[kind].chart}>
          <ChartAreaSkeleton label="Loading chart" className="[&_[data-slot=skeleton]]:h-60 sm:[&_[data-slot=skeleton]]:h-80" />
        </SectionCard>
      );
    }
    if (settledData.data === null) {
      return <ErrorMessage title="Couldn't load the chart" message={`The ${content[kind].tab.toLowerCase()} data for ${code} didn't load.`} onRetry={dataRequest.retry} />;
    }
    return (
      <ChartCard
        kind={kind}
        title={`${code} · ${content[kind].chart}`}
        courseTitle={resolved.course.title}
        data={settledData.data}
        code={code}
      />
    );
  })();

  return (
    <PageContainer>
      <PageHeader title="Graphs" description={content[kind].description} className="mb-5" />
      <RouteTabs label="Chart type" tabs={KINDS.map((target) => ({ label: content[target].tab, href: hrefFor(target), active: target === kind }))} />

      {departmentsResult?.attempt === departmentsRequest.requestVersion && departmentsResult.data === null && (
        <ErrorMessage className="mb-6" title="Couldn't load departments" message="The department list didn't load." onRetry={departmentsRequest.retry} />
      )}

      <AnalyticsCourseSelector
        departments={departments}
        courses={courses}
        selectedDepartmentId={deptId}
        selectedCourseId={courseValue}
        onDepartmentChange={(value) => setPickedDeptId(value)}
        onCourseChange={handleCourseChange}
      >
        {showRange && (
          <div className="w-full sm:w-auto">
            <span id="range-label" className="sr-only">
              Time range
            </span>
            <ToggleGroup
              aria-labelledby="range-label"
              value={[range]}
              onValueChange={(values) => {
                const next = values[0] as string | undefined;
                if (next) void setRange(next === DEFAULT_RANGE ? null : next);
              }}
              variant="outline"
              spacing={0}
              className="flex-wrap"
            >
              {RANGES.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value} className="px-3 aria-pressed:bg-primary aria-pressed:text-primary-foreground">
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
      </AnalyticsCourseSelector>

      {body}
    </PageContainer>
  );
}

function ChartCard({
  kind,
  title,
  courseTitle,
  code,
  data,
}: {
  kind: AnalyticsKind;
  title: string;
  courseTitle: string | null;
  code: string;
  data: GradeDistribution | EnrollmentDataPoint[];
}) {
  if (kind === "grades") {
    const grades = data as GradeDistribution;
    const hasData = Object.keys(grades.distribution ?? {}).length > 0;
    return (
      <SectionCard title={title} description={courseTitle} note={<ChartLegend kind="grades" />}>
        {hasData ? (
          <>
            <GradeHistogram distribution={grades.distribution} medianGrade={grades.medianGrade} showSummary={false} size="lg" />
            <GradeDataTable distribution={grades.distribution} caption={`${title} data`} />
            <Summary text={gradesSummary(grades)} />
          </>
        ) : (
          <TaskEmptyState icon={BarChart2} title={`No grade data for ${code}.`} description="CourseDiggers has no grades recorded for this course." />
        )}
      </SectionCard>
    );
  }

  const points = data as EnrollmentDataPoint[];
  return (
    <SectionCard title={title} description={courseTitle} note={points.length > 0 ? <ChartLegend kind={kind} /> : undefined}>
      {points.length === 0 ? (
        <TaskEmptyState icon={BarChart2} title={`No enrollment history for ${code} in this range.`} description="Try a longer time range." />
      ) : (
        <>
          {kind === "load" ? <LoadChart points={points} /> : <EnrollmentChart points={points} />}
          <HistoryDataTable kind={kind} points={points} caption={`${title} data`} />
          <Summary text={kind === "load" ? loadSummary(points) : enrollmentSummary(points)} />
        </>
      )}
    </SectionCard>
  );
}

function Summary({ text }: { text: string | null }) {
  if (!text) return null;
  return <p className={cn(bodyStyles.md, "mt-4 text-text-muted")}>{text}</p>;
}
