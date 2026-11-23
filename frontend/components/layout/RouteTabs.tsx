import Link from "next/link";
import { tabsListVariants } from "@/components/ui/tabs";
import { buttonStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

export interface RouteTab {
  label: string;
  href: string;
  active: boolean;
}

/**
 * URL-driven tabs: each tab is a Next Link (the URL is the state), styled like the
 * shadcn Tabs list. Exposed as a tablist with aria-selected for assistive tech.
 */
export default function RouteTabs({ tabs, label, className }: { tabs: RouteTab[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("mb-6", className)}>
      <div role="tablist" aria-label={label} className={cn(tabsListVariants(), "h-9 bg-surface-raised")}>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={tab.active}
            aria-current={tab.active ? "page" : undefined}
            className={cn(
              buttonStyles.md,
              "inline-flex h-full items-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              tab.active ? "bg-background text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
