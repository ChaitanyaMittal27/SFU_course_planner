import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusClasses: Record<string, string> = {
  open: "bg-success/10 text-success border-success/20",
  enrolling: "bg-success/10 text-success border-success/20",
  full: "bg-destructive/10 text-destructive border-destructive/20",
  closed: "bg-destructive/10 text-destructive border-destructive/20",
  waitlist: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-surface-raised text-text-subtle border-border",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const classes = statusClasses[key] ?? "bg-surface-raised text-text-muted border-border";

  return (
    <Badge variant="outline" className={cn("capitalize", classes, className)}>
      {status}
    </Badge>
  );
}
