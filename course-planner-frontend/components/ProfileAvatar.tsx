import { cn } from "@/lib/utils";
import { headerStyles } from "@/app/fonts";

interface ProfileAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: `w-24 h-24 ${headerStyles.lg}`,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileAvatar({ name, size = "md", className }: ProfileAvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
