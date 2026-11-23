import GraphQueryRedirect from "@/components/analytics/GraphQueryRedirect";

/** Old ?deptId=&courseId= links redirect to /graph/grades/{DEPT}/{NUM}; no course shows the pickers. */
export default function GradesGraphPage() {
  return <GraphQueryRedirect kind="grades" />;
}
