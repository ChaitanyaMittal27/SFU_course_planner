import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { labelStyles } from "@/app/fonts";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export default function BackButton({ onClick, label = "Back", className }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn("gap-1 text-text-muted hover:text-text-primary", labelStyles.md, className)}
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}
