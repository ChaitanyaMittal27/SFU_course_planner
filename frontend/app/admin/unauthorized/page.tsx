import Link from "next/link";
import { AuthCard } from "@/components/auth/LoginCard";
import { buttonVariants } from "@/components/ui/button";
import { bodyStyles, displayStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

export default function AdminUnauthorizedPage() {
  return (
    <AuthCard>
      <div className="text-center">
        <h1 className={cn(displayStyles.sm, "mb-2 text-text-primary")}>Access denied</h1>
        <p className={cn(bodyStyles.lg, "mb-6 text-text-muted")}>
          Your account does not have permission to access the administration area.
        </p>
        <Link href="/" className={buttonVariants({ size: "lg", className: "px-4" })}>
          Return to course planner
        </Link>
      </div>
    </AuthCard>
  );
}
