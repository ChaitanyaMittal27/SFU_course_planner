import { redirect } from "next/navigation";

/** /compare has no hub page: Courses is the default tab. */
export default function ComparePage() {
  redirect("/compare/courses");
}
