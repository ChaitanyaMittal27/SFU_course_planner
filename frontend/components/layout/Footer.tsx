import Link from "next/link";
import { bodyStyles } from "@/app/fonts";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const linkClass =
  "rounded-sm transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function Footer() {
  const apiDocsUrl = `${process.env.NEXT_PUBLIC_API_URL ?? "https://api.sfucourseplanner.com"}/api-docs`;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border">
      <div
        className={cn(
          bodyStyles.md,
          "mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-6 text-text-muted sm:px-7"
        )}
      >
        <p>© {year} SFU Course Planner</p>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/termsofservice" className={linkClass}>
            Terms
          </Link>
          <a href={apiDocsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            API docs
          </a>
          <Separator orientation="vertical" className="h-4 self-center" />
          <a
            href="https://github.com/ChaitanyaMittal27/SFU_course_planner"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(linkClass, "flex items-center gap-1.5")}
          >
            {/* Brand mark: Lucide ships no GitHub icon, so this inline SVG is the agreed exception. */}
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
