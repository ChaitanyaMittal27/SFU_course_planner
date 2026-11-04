import {
  Activity,
  Calendar,
  Eye,
  Flag,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavigationItem = {
  id: "overview" | "health" | "support" | "terms" | "users" | "bookmarks" | "rmp";
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const adminNavigationItems = [
  { id: "overview", label: "Overview", href: "/admin", icon: Activity },
  {
    id: "health",
    label: "Health",
    href: "/admin/health",
    icon: Activity,
    description: "Live status checks for the API, database, CourseSys, CourseDiggers, and Resend.",
  },
  {
    id: "support",
    label: "Support",
    href: "/admin/support",
    icon: MessageSquare,
    description: "Review contact submissions and respond to student questions.",
  },
  {
    id: "terms",
    label: "Terms",
    href: "/admin/terms",
    icon: Calendar,
    description: "Manage the current and enrolling academic terms.",
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Review registered users, signup trends, and notification preferences.",
  },
  {
    id: "bookmarks",
    label: "Bookmarks",
    href: "/admin/bookmarks",
    icon: Eye,
    description: "Inspect bookmarked offerings, popular courses, and department rankings.",
  },
  {
    id: "rmp",
    label: "RMP Reports",
    href: "/admin/rmp",
    icon: Flag,
    description: "Review wrong Rate My Professors matches reported from professor cards.",
  },
] as const satisfies readonly AdminNavigationItem[];
