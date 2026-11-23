import GraphQueryRedirect from "@/components/analytics/GraphQueryRedirect";

/** Old ?deptId=&courseId= links redirect to /graph/enrollment/{DEPT}/{NUM}; no course shows the pickers. */
export default function EnrollmentGraphPage() {
  return <GraphQueryRedirect kind="enrollment" />;
}
