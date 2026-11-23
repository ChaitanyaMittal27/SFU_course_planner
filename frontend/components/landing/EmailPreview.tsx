import { Clock } from "lucide-react";
import { bodyStyles, headerStyles, labelStyles, numericStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

// An HTML rebuild of the real daily digest email (NotificationScheduler), for
// illustration only. Always rendered light, using the --email-* tokens.
const EXAMPLE_DATE = "Tuesday, November 10, 2026";

type RowStatus = "ok" | "warn" | "bad";

const rows: { term: string; section: string; title: string; enrolled: string; status: string; tone: RowStatus }[] = [
  { term: "Spring 2027", section: "CMPT 225 D100", title: "Data Structures and Programming", enrolled: "110 / 200", status: "Open", tone: "ok" },
  { term: "Spring 2027", section: "CMPT 276 D100", title: "Introduction to Software Engineering", enrolled: "140 / 150", status: "Almost Full", tone: "warn" },
  { term: "Spring 2027", section: "MATH 232 D100", title: "Applied Linear Algebra", enrolled: "150 / 150 (+4)", status: "Full", tone: "bad" },
];

const toneClass: Record<RowStatus, string> = {
  ok: "text-email-ok",
  warn: "text-email-warn",
  bad: "text-email-bad",
};

// Use the preview's width: the two-column hero can be narrow even on desktop.
const cellPad = "px-2 py-2 @min-[40rem]:px-3";
const wideOnly = "hidden @min-[40rem]:table-cell";
const headCell = cn(labelStyles.sm, cellPad, "text-left uppercase tracking-wide text-email-muted");

export default function EmailPreview({ className }: { className?: string }) {
  return (
    <div className={cn("@container min-w-0", className)}>
      <p className={cn(bodyStyles.sm, "mb-2 flex items-center justify-end gap-1.5 text-text-muted")}>
        <Clock aria-hidden="true" className="size-3.5" />
        Arrives every morning at 12:05 AM
      </p>

      <div className="relative">
        <figure
          aria-label="Example of the daily enrollment email"
          className="relative overflow-hidden rounded-lg border border-border bg-email-card text-email-text shadow-sm"
        >
          {/* Mail client header */}
          <div className="flex items-start gap-3 border-b border-email-border bg-email-header px-4 py-3">
            <div
              aria-hidden="true"
              className={cn(labelStyles.sm, "flex size-9 shrink-0 items-center justify-center rounded-full bg-email-brand font-bold text-primary-foreground")}
            >
              SFU
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={cn(labelStyles.md, "truncate text-email-text")}>
                  SFU Course Planner{" "}
                  <span className="font-normal text-email-muted">&lt;notifications@sfucourseplanner.com&gt;</span>
                </p>
                <span className={cn(numericStyles.sm, "shrink-0 text-email-muted")}>12:05 AM</span>
              </div>
              <p className={cn(bodyStyles.sm, "mt-0.5 truncate font-medium text-email-text")}>
                SFU Course Planner — Daily Enrollment Update
              </p>
            </div>
          </div>

          {/* Email body */}
          <div className="bg-email-canvas px-3 py-5 sm:px-5">
            <div className="mb-4 flex items-center justify-center gap-2">
              <span
                aria-hidden="true"
                className={cn(labelStyles.sm, "flex size-6 items-center justify-center rounded-sm bg-email-brand font-bold text-primary-foreground")}
              >
                SFU
              </span>
              <span className={cn(headerStyles.xs, "text-email-text")}>SFU Course Planner</span>
            </div>

            <div className="rounded-md border border-email-border bg-email-card p-3 sm:p-4">
              <p className={cn(headerStyles.sm, "text-email-text")}>Enrollment Update</p>
              <p className={cn(bodyStyles.sm, "mb-3 text-email-muted")}>{EXAMPLE_DATE}</p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-email-border bg-email-header">
                      <th scope="col" className={cn(headCell, wideOnly)}>Term</th>
                      <th scope="col" className={headCell}>Section</th>
                      <th scope="col" className={cn(headCell, wideOnly)}>Title</th>
                      <th scope="col" className={headCell}>Enrolled</th>
                      <th scope="col" className={headCell}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={bodyStyles.sm}>
                    {rows.map((row) => (
                      <tr key={row.section} className="border-b border-email-border align-top last:border-b-0">
                        <td className={cn(cellPad, wideOnly, "whitespace-nowrap text-email-muted")}>{row.term}</td>
                        <td className={cn(cellPad, "font-medium")}>
                          <span>{row.section}</span>
                          <span className="block font-normal text-email-muted @min-[40rem]:hidden">{row.title}</span>
                        </td>
                        <td className={cn(cellPad, wideOnly)}>{row.title}</td>
                        <td className={cn(numericStyles.sm, cellPad, "@min-[40rem]:whitespace-nowrap")}>{row.enrolled}</td>
                        <td className={cn(cellPad, "font-semibold", toneClass[row.tone])}>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className={cn(bodyStyles.sm, "mt-4 text-center text-email-muted")}>
              Manage your bookmarks and notification preferences at sfucourseplanner.com
            </p>
          </div>
        </figure>
      </div>
    </div>
  );
}
