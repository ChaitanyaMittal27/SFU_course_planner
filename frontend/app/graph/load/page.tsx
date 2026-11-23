import GraphQueryRedirect from "@/components/analytics/GraphQueryRedirect";

/** Old ?deptId=&courseId= links redirect to /graph/load/{DEPT}/{NUM}; no course shows the pickers. */
export default function LoadGraphPage() {
  return <GraphQueryRedirect kind="load" />;
}
