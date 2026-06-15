import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { headerStyles, bodyStyles } from "@/app/fonts";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <Card className="border-l-4 border-destructive p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
        <div className="flex-1">
          <h3 className={`${headerStyles.sm} text-destructive mb-1`}>Error Loading Data</h3>
          <p className={`${bodyStyles.md} text-text-muted mb-3`}>{message}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
