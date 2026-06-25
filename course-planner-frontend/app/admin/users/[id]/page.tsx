"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Shield, Calendar, Eye, Bell, Bookmark } from "lucide-react";
import { api, AdminUserDetailResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "@/components/ErrorMessage";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function decodeSemester(code: number) {
  const year = Math.floor(code / 10) + 1900;
  const digit = code % 10;
  const term = digit === 1 ? "Spring" : digit === 4 ? "Summer" : digit === 7 ? "Fall" : "Unknown";
  return `${term} ${year}`;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setError(null);
      const result = await api.getAdminUser(userId);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load user";
      setError(message);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl mt-4" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <Button variant="outline" onClick={() => router.push("/admin/users")} className="gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to users
        </Button>
        <ErrorMessage message={error || "User not found"} onRetry={fetchUser} />
      </div>
    );
  }

  const { user, bookmarks } = data;

  return (
    <div className="flex-1 p-8 max-w-[1180px]">
      {/* Back button */}
      <Button variant="outline" onClick={() => router.push("/admin/users")} className="gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to users
      </Button>

      {/* Heading */}
      <div className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary mb-1`}>{user.email}</h1>
        <p className={`${bodyStyles.md} text-text-muted`}>
          {user.displayName ? `${user.displayName} — ` : ""}User detail and activity
        </p>
      </div>

      {/* Identity + Notifications cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Identity card */}
        <Card className="p-5">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-text-muted" />
              <h2 className={`${headerStyles.xs} text-text-primary`}>Identity</h2>
            </div>
            <div className="space-y-3">
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Display Name" value={user.displayName || "—"} />
              <div className="flex items-center justify-between">
                <span className={`${labelStyles.md} text-text-muted`}>Provider</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  user.provider === "google"
                    ? "bg-accent/15 text-accent"
                    : "bg-text-muted/15 text-text-muted"
                }`}>
                  {user.provider === "google" ? "Google" : "Email"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`${labelStyles.md} text-text-muted`}>Email Verified</span>
                <Badge className={user.emailVerified
                  ? "bg-success/15 text-success border-transparent"
                  : "bg-destructive/15 text-destructive border-transparent"
                }>
                  {user.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <DetailRow label="Joined" value={formatDate(user.createdAt)} />
              <DetailRow label="Last Sign In" value={formatDate(user.lastSignInAt)} />
              {user.isAnonymous && (
                <div className="flex items-center justify-between">
                  <span className={`${labelStyles.md} text-text-muted`}>Anonymous</span>
                  <Badge className="bg-warning/15 text-warning border-transparent">Yes</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications card */}
        <Card className="p-5">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-text-muted" />
              <h2 className={`${headerStyles.xs} text-text-primary`}>Notification Preferences</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`${labelStyles.md} text-text-muted`}>Email Notifications</span>
                <Badge className={user.emailNotificationsEnabled
                  ? "bg-success/15 text-success border-transparent"
                  : "bg-text-muted/15 text-text-muted border-transparent"
                }>
                  {user.emailNotificationsEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <DetailRow label="Preferred Email" value={user.preferredEmail || "—"} />
              <DetailRow label="Last Notified" value={user.lastNotifiedAt ? formatDate(user.lastNotifiedAt) : "Never"} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookmarks */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-text-muted" />
              <h2 className={`${headerStyles.xs} text-text-primary`}>Bookmarks</h2>
            </div>
            <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{bookmarks.length} bookmarks</span>
          </div>

          {bookmarks.length > 0 ? (
            <>
              <div className="grid grid-cols-[1fr_100px_120px] px-5 py-2.5 bg-surface-raised border-b border-border">
                <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>Course</span>
                <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Section</span>
                <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Semester</span>
              </div>
              {bookmarks.map((b, i) => (
                <div
                  key={b.bookmarkId}
                  className={`grid grid-cols-[1fr_100px_120px] px-5 py-3 items-center hover:bg-surface-raised transition-colors ${
                    i < bookmarks.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div>
                    <span className={`${labelStyles.lg} text-text-primary`}>
                      {b.deptCode} {b.courseNumber}
                    </span>
                    {b.title && (
                      <span className={`${bodyStyles.sm} text-text-muted block truncate max-w-xs mt-0.5`}>
                        {b.title}
                      </span>
                    )}
                  </div>
                  <div className={`${labelStyles.md} font-mono text-text-primary text-center`}>{b.section}</div>
                  <div className={`${labelStyles.sm} font-mono text-text-subtle text-center`}>{decodeSemester(b.semesterCode)}</div>
                </div>
              ))}
            </>
          ) : (
            <div className={`${bodyStyles.md} text-text-muted text-center py-8`}>No bookmarks</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${labelStyles.md} text-text-muted`}>{label}</span>
      <span className={`${labelStyles.md} font-mono text-text-primary`}>{value}</span>
    </div>
  );
}
