import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  /** Shorthand for a title-only PageHeader. Prefer rendering <PageHeader> directly. */
  title?: string;
  className?: string;
}

/**
 * The single page width (max-w-page, 1180px). Renders a <div>: AppShell already
 * provides the page's <main> landmark.
 */
export default function PageContainer({ children, title, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-page px-4 py-10 sm:px-7", className)}>
      {title && <PageHeader title={title} />}
      {children}
    </div>
  );
}
