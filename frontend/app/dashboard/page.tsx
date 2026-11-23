"use client";

import { seatLoadPercent } from "@/lib/enrollment-status";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { api, BookmarkOffering, Bookmark, Course, Department } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SectionCard, { cardPadding, cardTable } from "@/components/course/SectionCard";
import SummaryRow from "@/components/course/SummaryRow";
import LoadBar from "@/components/enrollment/LoadBar";
import StatusBadge from "@/components/enrollment/StatusBadge";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { TableRowsSkeleton, PageSkeleton } from "@/components/feedback/Skeletons";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bodyStyles, headerStyles, labelStyles, numericStyles } from "@/app/fonts";
import { offeringHref, sectionCode } from "@/lib/course-routes";
import { formatTerm } from "@/lib/course-stats";
import { getEnrollmentStatus } from "@/lib/enrollment-status";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import { cn } from "@/lib/utils";

const toTitleCase = (str: string) => str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function errorText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PROVIDER_LABELS: Record<string, string> = { email: "Email and password", google: "Google", azure: "Microsoft" };

interface EditableRowProps {
  label: string;
  /** Shown when not editing. */
  value: React.ReactNode;
  editing: boolean;
  saving?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  /** The field shown while editing; must carry its own id and accessible label. */
  field: React.ReactNode;
}

/** One settings row with the shared inline edit pattern: Edit → field + Save/Cancel. */
function EditableRow({ label, value, editing, saving = false, onEdit, onCancel, onSave, field }: EditableRowProps) {
  return (
    <div className={cn(cardPadding, "py-3.5 sm:py-3.5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn(bodyStyles.sm, "text-text-subtle")}>{label}</p>
          {!editing && <div className={cn(bodyStyles.md, "truncate text-text-primary")}>{value}</div>}
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${label.toLowerCase()}`}>
            Edit
          </Button>
        )}
      </div>
      {editing && (
        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          {field}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function DashboardPageContent() {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [offerings, setOfferings] = useState<BookmarkOffering[]>([]);
  const [courses, setCourses] = useState<Map<number, Course>>(new Map());
  const [departments, setDepartments] = useState<Map<number, Department>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const { requestVersion, retry } = useRetryableRequest();

  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [emailToggleUpdating, setEmailToggleUpdating] = useState(false);
  const [preferredEmail, setPreferredEmail] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editableEmail, setEditableEmail] = useState("");

  const [pendingRemoval, setPendingRemoval] = useState<{ bookmark: Bookmark; label: string } | null>(null);

  useEffect(() => {
    if (user) {
      // Keep the saved profile label synchronized with Supabase user updates.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "User");
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let isActive = true;

    async function loadData() {
      try {
        setDataLoading(true);
        setError(null);

        const allDepartments = await api.getDepartments();
        const deptMap = new Map(allDepartments.map((d) => [d.deptId, d]));
        if (isActive) setDepartments(deptMap);

        const [bookmarkData, offeringData, preferences] = await Promise.all([
          api.getBookmarks(),
          api.getBookmarkOfferings(),
          api.getUserPreferences(),
        ]);
        if (isActive) {
          setBookmarks(bookmarkData);
          setOfferings(offeringData);
          setEmailNotificationsEnabled(preferences.emailNotificationsEnabled);
          setPreferredEmail(preferences.userEmail);
        }

        const uniqueDeptIds = [...new Set(bookmarkData.map((b) => b.deptId))];
        const coursesMap = new Map<number, Course>();
        let courseDetailsFailed = false;

        await Promise.all(
          uniqueDeptIds.map(async (deptId) => {
            try {
              const deptCourses = await api.getCourses(deptId);
              deptCourses.forEach((course) => coursesMap.set(course.courseId, course));
            } catch {
              // Bookmarks still render (without course titles); say so and offer a retry.
              courseDetailsFailed = true;
            }
          }),
        );

        if (isActive) {
          setCourses(coursesMap);
          if (courseDetailsFailed) {
            toast.error("Couldn't load some course details.", { action: { label: "Try again", onClick: retry } });
          }
        }
      } catch (err: unknown) {
        if (isActive) setError(errorText(err, "Failed to load bookmarks"));
      } finally {
        if (isActive) setDataLoading(false);
      }
    }

    void loadData();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, requestVersion, retry, user?.id]);

  const handleDelete = async (bookmark: Bookmark, label: string) => {
    try {
      await api.deleteBookmark(bookmark.bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.bookmarkId !== bookmark.bookmarkId));
      setOfferings((prev) => prev.filter((offering) => offering.bookmarkId !== bookmark.bookmarkId));
      toast.success(`Removed ${label} from your bookmarks.`);
    } catch (err: unknown) {
      toast.error(`Couldn't remove ${label}: ${errorText(err, "Unknown error")}`);
    }
  };

  const bookmarkHref = (bookmark: Bookmark) => {
    const { deptId, courseId, semesterCode } = bookmark;
    const course = courses.get(courseId);
    const department = departments.get(deptId);
    return course && department
      ? offeringHref(department.deptCode, course.courseNumber, semesterCode)
      : `/browse/departments/${deptId}/courses/${courseId}/offerings/${semesterCode}`;
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: nameDraft } });
      if (error) throw error;
      setDisplayName(nameDraft);
      setEditingName(false);
      toast.success("Display name updated.");
    } catch (err) {
      toast.error(`Couldn't update your display name: ${errorText(err, "Unknown error")}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setEditingPassword(false);
      toast.success("Password updated");
    } catch (err: unknown) {
      toast.error(errorText(err, "Failed to update password"));
    } finally {
      setSaving(false);
    }
  };

  const handleEmailToggle = async () => {
    const newValue = !emailNotificationsEnabled;
    setEmailToggleUpdating(true);
    try {
      const updated = await api.updateEmailNotificationPreference(newValue);
      setEmailNotificationsEnabled(updated.emailNotificationsEnabled);
      toast.success(updated.emailNotificationsEnabled ? "Morning email turned on." : "Morning email turned off.");
    } catch (err) {
      toast.error(`Couldn't update your email alerts: ${errorText(err, "Unknown error")}`);
    } finally {
      setEmailToggleUpdating(false);
    }
  };

  const handleSavePreferredEmail = async () => {
    if (!editableEmail) return;
    setSaving(true);
    try {
      const updated = await api.updatePreferredEmail(editableEmail);
      setPreferredEmail(updated.userEmail);
      setIsEditingEmail(false);
      toast.success("Notification email updated.");
    } catch (err) {
      toast.error(`Couldn't update your notification email: ${errorText(err, "Unknown error")}`);
    } finally {
      setSaving(false);
    }
  };

  const getMemberSince = () => {
    if (!user?.created_at) return "Recently";
    return new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getCourseInfo = (bookmark: Bookmark) => {
    const course = courses.get(bookmark.courseId);
    const dept = departments.get(bookmark.deptId);
    if (!course || !dept) return null;
    return { deptCode: dept.deptCode, courseNumber: course.courseNumber, title: course.title || "Untitled Course" };
  };

  const getOffering = (bookmark: Bookmark) => offerings.find((offering) => offering.bookmarkId === bookmark.bookmarkId);

  const fillingFast = offerings.filter((o) => getEnrollmentStatus(seatLoadPercent(o)) !== "open").length;
  const averageLoad =
    offerings.length > 0 ? Math.floor(offerings.reduce((sum, o) => sum + seatLoadPercent(o), 0) / offerings.length) : 0;

  if (authLoading) return <PageSkeleton label="Loading your dashboard" />;

  if (!isAuthenticated || !user) {
    return (
      <PageContainer className="max-w-xl">
        <Alert>
          <AlertTitle>Your session could not be restored in this tab.</AlertTitle>
          <AlertDescription>
            <a className="text-accent-text hover:underline" href="/login?redirectTo=%2Fdashboard">
              Sign in again
            </a>
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const provider = (user.app_metadata?.provider as string | undefined) ?? "email";

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="Track your courses and stay on top of enrollment changes."
        actions={
          <Link href="/browse" className={buttonVariants({ variant: "outline" })}>
            Browse courses
          </Link>
        }
      />

      <SummaryRow
        items={[
          { label: "Watching", value: String(bookmarks.length) },
          { label: "Filling fast", value: String(fillingFast) },
          { label: "Average load", value: offerings.length > 0 ? `${averageLoad}%` : "—" },
          { label: "Email alerts", value: emailNotificationsEnabled ? "On" : "Off" },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <SectionCard
          title="Bookmarks"
          note={bookmarks.length > 0 ? "Included in your morning email" : undefined}
          flush={!dataLoading && !error && bookmarks.length > 0}
        >
          {dataLoading && <TableRowsSkeleton rows={4} columns={4} label="Loading bookmarks" />}
          {error && <ErrorMessage className="rounded-none border-0 bg-transparent p-0" message={error} onRetry={retry} />}
          {!dataLoading && !error && bookmarks.length === 0 && (
            <TaskEmptyState
              icon={BookmarkPlus}
              title="No watchers yet"
              description="Browse courses to track enrollment and updates"
              action={
                <Link href="/browse" className={buttonVariants()}>
                  Browse courses
                </Link>
              }
            />
          )}
          {!dataLoading && !error && bookmarks.length > 0 && (
            <Table className="block sm:table">
              <TableHeader className="sr-only sm:not-sr-only sm:table-header-group">
                <TableRow className={cardTable.headRow}>
                  <TableHead className={cardTable.head}>Course</TableHead>
                  <TableHead className={cardTable.head}>Section / Term</TableHead>
                  <TableHead className={cardTable.head}>Enrolled / cap</TableHead>
                  <TableHead className={cardTable.head}>Load</TableHead>
                  <TableHead className={cardTable.head}>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="block sm:table-row-group">
                {bookmarks.map((bookmark) => {
                  const courseInfo = getCourseInfo(bookmark);
                  const offering = getOffering(bookmark);
                  const section = sectionCode(bookmark.section);
                  const label = courseInfo ? `${courseInfo.deptCode} ${courseInfo.courseNumber} ${section}` : section;

                  return (
                    <TableRow key={bookmark.bookmarkId} className={cn(cardTable.row, "group relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-3 sm:table-row sm:p-0 [&>td]:px-0 [&>td]:py-1 sm:[&>td]:px-5 sm:[&>td]:py-3")}>
                      <TableCell className={cn(cardTable.cell, "min-w-0")}>
                        {courseInfo ? (
                          <>
                            <Link
                              href={bookmarkHref(bookmark)}
                              className={cn(
                                numericStyles.md,
                                "font-semibold text-text-primary underline-offset-4 group-hover:underline focus-visible:outline-none",
                                "after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                              )}
                            >
                              {courseInfo.deptCode} {courseInfo.courseNumber}
                            </Link>
                            <div className={cn(bodyStyles.sm, "mt-0.5 max-w-xs whitespace-normal text-text-muted sm:truncate")}>{toTitleCase(courseInfo.title)}</div>
                          </>
                        ) : (
                          <Link href={bookmarkHref(bookmark)} className={cn(bodyStyles.md, "text-text-subtle after:absolute after:inset-0")}>
                            Loading...
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className={cn(cardTable.cell, "row-start-2")}>
                        <div className={cn(numericStyles.md, "text-text-primary")}>{section}</div>
                        <div className={cn(bodyStyles.sm, "mt-0.5 text-text-muted")}>{offering ? formatTerm(offering.term, offering.year) : "—"}</div>
                      </TableCell>
                      <TableCell className={cn(cardTable.cell, numericStyles.md, "row-start-3 text-text-primary")}>
                        <span className={cn(bodyStyles.sm, "mr-2 text-text-muted sm:hidden")}>Enrolled / cap</span>
                        {offering ? `${offering.enrolled} / ${offering.capacity}` : "—"}
                      </TableCell>
                      <TableCell className={cn(cardTable.cell, "col-span-2 row-start-4")}>
                        {offering ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <LoadBar percent={seatLoadPercent(offering)} />
                            <StatusBadge loadPercent={seatLoadPercent(offering)} />
                          </div>
                        ) : (
                          <span className={cn(bodyStyles.md, "text-text-subtle")}>—</span>
                        )}
                      </TableCell>
                      <TableCell className={cn(cardTable.cell, "col-start-2 row-start-1 w-8 sm:w-12")}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setPendingRemoval({ bookmark, label })}
                          aria-label={`Remove ${label}`}
                          className="relative z-10 text-text-muted hover:text-destructive-text"
                        >
                          <X aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Email alerts" flush>
            <div className="divide-y divide-border">
              <div className={cn(cardPadding, "flex items-center justify-between gap-4 py-3.5 sm:py-3.5")}>
                <div>
                  <Label htmlFor="morning-email" className={cn(labelStyles.lg, "text-text-primary")}>
                    Morning email
                  </Label>
                  <p className={cn(bodyStyles.sm, "text-text-muted")}>Seat counts for your bookmarks, every day at 12:05 AM.</p>
                </div>
                <Switch
                  id="morning-email"
                  checked={emailNotificationsEnabled}
                  onCheckedChange={handleEmailToggle}
                  disabled={emailToggleUpdating}
                />
              </div>
              <EditableRow
                label="Notification email"
                value={preferredEmail || <span className="text-text-subtle">No notification email set</span>}
                editing={isEditingEmail}
                saving={saving}
                onEdit={() => {
                  setEditableEmail(preferredEmail || user.email || "");
                  setIsEditingEmail(true);
                }}
                onCancel={() => setIsEditingEmail(false)}
                onSave={handleSavePreferredEmail}
                field={
                  <Input
                    id="notification-email"
                    aria-label="Notification email"
                    type="email"
                    value={editableEmail}
                    onChange={(e) => setEditableEmail(e.target.value)}
                    placeholder="Notification email"
                  />
                }
              />
            </div>
          </SectionCard>

          <SectionCard title="Profile" flush>
            <div className={cn(cardPadding, "flex items-center gap-3 border-b border-border")}>
              <Avatar className="size-11">
                <AvatarFallback className={cn(labelStyles.lg, "bg-surface-raised text-text-primary")}>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className={cn(headerStyles.sm, "truncate text-text-primary")}>{displayName}</p>
                <p className={cn(bodyStyles.sm, "truncate text-text-muted")}>{user.email}</p>
                <p className={cn(bodyStyles.sm, "text-text-subtle")}>
                  {PROVIDER_LABELS[provider] ?? provider} · Member since {getMemberSince()}
                </p>
              </div>
            </div>
            <div className="divide-y divide-border">
              <EditableRow
                label="Display name"
                value={displayName}
                editing={editingName}
                saving={saving}
                onEdit={() => {
                  setNameDraft(displayName);
                  setEditingName(true);
                }}
                onCancel={() => setEditingName(false)}
                onSave={handleSaveName}
                field={
                  <Input id="display-name" aria-label="Display name" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Display Name" />
                }
              />
              <EditableRow
                label="Password"
                value={<span aria-label="Password set">••••••••</span>}
                editing={editingPassword}
                saving={saving}
                onEdit={() => setEditingPassword(true)}
                onCancel={() => {
                  setEditingPassword(false);
                  setNewPassword("");
                }}
                onSave={handleChangePassword}
                field={
                  <Input
                    id="new-password"
                    aria-label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                  />
                }
              />
              <div className={cn(cardPadding, "py-3 sm:py-3")}>
                <Button variant="ghost" className="-ml-2.5 text-destructive-text" onClick={() => void signOut()}>
                  <LogOut aria-hidden="true" />
                  Sign out
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingRemoval?.label} from your bookmarks?</AlertDialogTitle>
            <AlertDialogDescription>It won&apos;t be in your morning email anymore. You can bookmark it again any time.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingRemoval) void handleDelete(pendingRemoval.bookmark, pendingRemoval.label);
                setPendingRemoval(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
