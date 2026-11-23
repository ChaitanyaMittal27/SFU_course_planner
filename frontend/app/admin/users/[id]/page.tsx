"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api, AdminUserDetailResponse } from "@/lib/api";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import { formatSemesterCode } from "@/lib/semester";
import { AdminPage, AdminPageHeader, AdminTable } from "@/components/admin/AdminPage";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { Badge } from "@/components/ui/badge";
import SectionCard, { cardPadding } from "@/components/course/SectionCard";
import { cn } from "@/lib/utils";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const result = await api.getAdminUser(params.id);
        if (active) {
          setError(null);
          setData(result);
        }
      } catch (requestError: unknown) {
        if (active) setError(errorMessage(requestError, "Failed to load this user."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => { active = false; };
  }, [params.id]);

  const fetchUser = useCallback(async () => {
    try {
      setError(null);
      setData(await api.getAdminUser(params.id));
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, "Failed to load this user."));
    }
  }, [params.id]);

  if (loading) return <AdminPageSkeleton hasTable tableRows={5} />;

  const backLink = (
    <Link href="/admin/users" className={`${labelStyles.md} inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
      <ArrowLeft className="size-4" />
      Back to users
    </Link>
  );

  if (error || !data) {
    return (
      <AdminPage>
        <div className="mb-4">{backLink}</div>
        <ErrorMessage message={error ?? "User not found."} onRetry={fetchUser} />
      </AdminPage>
    );
  }

  const { user, bookmarks } = data;
  const details = [
    { label: "Email", value: user.email },
    { label: "Provider", value: user.provider || "email" },
    { label: "Joined", value: formatDate(user.createdAt) },
    { label: "Last sign-in", value: formatDate(user.lastSignInAt) },
  ];

  return (
    <AdminPage>
      <div className="mb-4">{backLink}</div>
      <AdminPageHeader title={user.displayName || user.email} description="Account information and saved course offerings." />

      <SectionCard title="Account" flush className="mb-6">
        <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:[&>div:nth-child(n+3)]:border-t sm:[&>div:nth-child(even)]:border-l [&>div]:border-border">
          {details.map(({ label, value }) => (
            <div key={label} className={cn(cardPadding, "py-3 sm:py-3")}>
              <dt className={cn(bodyStyles.sm, "text-text-subtle")}>{label}</dt>
              <dd className={cn(bodyStyles.md, "break-words text-text-primary")}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className={cn(cardPadding, "flex flex-wrap items-center gap-2 border-t border-border")}>
          <Badge className={user.emailVerified ? "border-transparent bg-success-tint text-success-text" : "border-transparent bg-warning-tint text-warning-text"}>
            {user.emailVerified ? "Email verified" : "Email unverified"}
          </Badge>
          <Badge variant="outline">{user.emailNotificationsEnabled ? "Notifications enabled" : "Notifications disabled"}</Badge>
          {user.isAnonymous && <Badge variant="outline">Anonymous account</Badge>}
          {user.preferredEmail && <span className={cn(bodyStyles.sm, "text-text-muted")}>Notification email: {user.preferredEmail}</span>}
        </div>
      </SectionCard>

      <AdminTable title="Saved offerings" note={`${bookmarks.length} saved`}>
          <table className="w-full min-w-[620px] text-left">
            <thead className="bg-surface-raised">
              <tr className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Section</th>
              </tr>
            </thead>
            <tbody>
              {bookmarks.map((bookmark) => (
                <tr key={bookmark.bookmarkId} className="border-t border-border">
                  <td className={`${labelStyles.lg} whitespace-nowrap px-4 py-3 text-text-primary`}>{bookmark.deptCode} {bookmark.courseNumber}</td>
                  <td className={`${bodyStyles.sm} max-w-80 truncate px-4 py-3 text-text-muted`}>{bookmark.title || "—"}</td>
                  <td className={`${bodyStyles.sm} whitespace-nowrap px-4 py-3 text-text-muted`}>{formatSemesterCode(bookmark.semesterCode)}</td>
                  <td className={`${numericStyles.sm} whitespace-nowrap px-4 py-3 text-text-primary`}>{bookmark.section}</td>
                </tr>
              ))}
              {bookmarks.length === 0 && (
                <tr><td colSpan={4} className={`${bodyStyles.md} px-4 py-10 text-center text-text-muted`}>This user has no saved offerings.</td></tr>
              )}
            </tbody>
          </table>
      </AdminTable>

      <p className={cn(bodyStyles.sm, "mt-4 text-text-subtle")}>Bookmark data is read-only in the admin console.</p>
    </AdminPage>
  );
}
