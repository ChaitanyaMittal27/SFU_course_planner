import PageHeader from "@/components/layout/PageHeader";
import RouteTabs from "@/components/layout/RouteTabs";

export type CompareTab = "courses" | "sections";

const descriptions: Record<CompareTab, string> = {
  courses: "Up to three courses side by side.",
  sections: "Pick a course and term, then the sections you're choosing between.",
};

/** "Compare" page header plus the Courses | Sections tabs (URL-driven). */
export default function CompareHeader({ tab }: { tab: CompareTab }) {
  return (
    <>
      <PageHeader title="Compare" description={descriptions[tab]} className="mb-5" />
      <RouteTabs
        label="Compare"
        tabs={[
          { label: "Courses", href: "/compare/courses", active: tab === "courses" },
          { label: "Sections", href: "/compare/sections", active: tab === "sections" },
        ]}
      />
    </>
  );
}
