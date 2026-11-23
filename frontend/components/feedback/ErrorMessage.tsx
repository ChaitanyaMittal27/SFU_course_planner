import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  /** Short summary; describe what failed when you can (e.g. "Couldn't load offerings"). */
  title?: string;
  message: string;
  /** Only pass a handler that actually re-runs the failed request. */
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({ title = "Something went wrong", message, onRetry, className }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className={cn("px-4 py-3", className)}>
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {onRetry && (
        <div className="col-start-2 mt-3">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </Alert>
  );
}
