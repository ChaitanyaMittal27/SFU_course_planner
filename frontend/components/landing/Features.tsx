import type { ReactNode } from "react";
import Link from "next/link";
import { bodyStyles, displayStyles, headerStyles, labelStyles, numericStyles } from "@/app/fonts";
import LoadBar from "@/components/enrollment/LoadBar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Illustrative preview data — not live.
const seatRows = [
  { code: "CMPT 225", load: 55 },
  { code: "CMPT 276", load: 93 },
  { code: "MATH 232", load: 100 },
];

// Grade-distribution shape for the mini chart; index 5 is the median bar.
const trendBars = [14, 26, 42, 60, 78, 100, 84, 62, 40, 24, 12];
const MEDIAN_BAR = 5;

function SeatsPreview() {
  return (
    <div className="space-y-2.5">
      {seatRows.map((row) => (
        <div key={row.code} className="flex items-center justify-between gap-4">
          <span className={cn(labelStyles.lg, "text-text-primary")}>{row.code}</span>
          <LoadBar percent={row.load} />
        </div>
      ))}
    </div>
  );
}

function ComparePreview() {
  const cell = cn(numericStyles.sm, "py-1.5 text-right text-text-primary");
  const label = cn(bodyStyles.sm, "py-1.5 text-left font-normal text-text-muted");
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border">
          <th scope="col" className="w-1/3 py-1.5">
            <span className="sr-only">Measure</span>
          </th>
          <th scope="col" className={cn(labelStyles.md, "py-1.5 text-right text-text-primary")}>CMPT 225</th>
          <th scope="col" className={cn(labelStyles.md, "py-1.5 text-right text-text-primary")}>CMPT 213</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-border">
          <th scope="row" className={label}>Median</th>
          <td className={cell}>B-</td>
          <td className={cell}>B</td>
        </tr>
        <tr>
          <th scope="row" className={label}>Fail rate</th>
          <td className={cell}>8%</td>
          <td className={cell}>6%</td>
        </tr>
      </tbody>
    </table>
  );
}

function TrendsPreview() {
  return (
    <div className="flex h-16 items-end gap-1.5" aria-hidden="true">
      {trendBars.map((height, i) => (
        <span
          key={i}
          className={cn("flex-1 rounded-t-sm", i === MEDIAN_BAR ? "bg-accent" : "bg-border-strong")}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function ProfessorPreview() {
  return (
    <div>
      <p className="flex items-baseline gap-1.5">
        <span className={cn(numericStyles.xl, "text-text-primary")}>4.3</span>
        <span className={cn(bodyStyles.sm, "text-text-muted")}>/ 5 overall</span>
      </p>
      <p className={cn(bodyStyles.sm, "mt-2 text-text-muted")}>
        <span className={numericStyles.base}>84%</span> would take again ·{" "}
        <span className={numericStyles.base}>112</span> ratings
      </p>
    </div>
  );
}

const features: { title: string; description: string; href: string; preview: ReactNode }[] = [
  {
    title: "Browse live seats",
    description: "Current enrollment for every section, straight from CourseSys.",
    href: "/browse",
    preview: <SeatsPreview />,
  },
  {
    title: "Compare side by side",
    description: "Median grades and fail rates for up to three courses at once.",
    href: "/compare/courses",
    preview: <ComparePreview />,
  },
  {
    title: "See the trends",
    description: "Grade distributions and enrollment history, term by term.",
    href: "/graph/load",
    preview: <TrendsPreview />,
  },
  {
    title: "Know your professor",
    description: "RateMyProfessors ratings next to each section's instructor.",
    href: "/browse",
    preview: <ProfessorPreview />,
  },
];

export default function Features() {
  return (
    <section className="mx-auto max-w-page px-4 pb-20 sm:px-7">
      <Separator className="mb-14" />
      <div className="mb-8 max-w-2xl">
        <h2 className={cn(displayStyles.sm, "text-text-primary")}>Everything you check during enrollment, in one place</h2>
        <p className={cn(bodyStyles.lg, "mt-2 text-text-muted")}>
          Live seats from CourseSys, grade history from CourseDiggers, and ratings from RateMyProfessors.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <li key={feature.title}>
            <Link
              href={feature.href}
              className="flex h-full flex-col gap-6 rounded-lg border border-border bg-surface p-6 transition-colors hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div>
                <h3 className={cn(headerStyles.md, "text-text-primary")}>{feature.title}</h3>
                <p className={cn(bodyStyles.md, "mt-1 text-text-muted")}>{feature.description}</p>
              </div>
              <div className="mt-auto">{feature.preview}</div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
