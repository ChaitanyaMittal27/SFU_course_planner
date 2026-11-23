import { redirect } from "next/navigation";

/** /graph has no hub page: Load is the default chart. */
export default function GraphPage() {
  redirect("/graph/load");
}
