"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, TrendingUp, BarChart3, Bell, X, ChevronDown, ChevronUp, Check, Pencil } from "lucide-react";
import { api, CourseOffering, Bookmark, Course, Department } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import ProfileAvatar from "@/components/ProfileAvatar";
import LoadBar from "@/components/LoadBar";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const formatTerm = (term: string, year: number) =>
  term.charAt(0).toUpperCase() + term.slice(1) + " " + year;

const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const getStatusFromLoad = (loadPercent: number): string =>
  loadPercent >= 95 ? "Almost full" : loadPercent >= 80 ? "Filling" : "Open";

function DashboardPageContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [courses, setCourses] = useState<Map<number, Course>>(new Map());
  const [departments, setDepartments] = useState<Map<number, Department>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [emailToggleUpdating, setEmailToggleUpdating] = useState(false);
  const [preferredEmail, setPreferredEmail] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editableEmail, setEditableEmail] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?returnTo=/dashboard");
        return;
      }

      setUser(session.user);
      setDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "User");
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const allDepartments = await api.getDepartments();
        const deptMap = new Map(allDepartments.map((d) => [d.deptId, d]));
        setDepartments(deptMap);

        const [bookmarkData, offeringData, preferences] = await Promise.all([
          api.getBookmarks(),
          api.getBookmarkOfferings(),
          api.getUserPreferences(),
        ]);
        setBookmarks(bookmarkData);
        setOfferings(offeringData);
        setEmailNotificationsEnabled(preferences.emailNotificationsEnabled);
        setPreferredEmail(preferences.userEmail);

        const uniqueDeptIds = [...new Set(bookmarkData.map((b) => b.deptId))];
        const coursesMap = new Map<number, Course>();

        await Promise.all(
          uniqueDeptIds.map(async (deptId) => {
            try {
              const deptCourses = await api.getCourses(deptId);
              deptCourses.forEach((course) => coursesMap.set(course.courseId, course));
            } catch (err) {
              console.error(`Failed to load courses for dept ${deptId}:`, err);
            }
          }),
        );

        setCourses(coursesMap);
      } catch (err: any) {
        console.error("Failed to load bookmarks:", err);
        setError(err.message || "Failed to load bookmarks");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleDelete = async (bookmarkId: number) => {
    try {
      await api.deleteBookmark(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.bookmarkId !== bookmarkId));
      const deleted = bookmarks.find((b) => b.bookmarkId === bookmarkId);
      if (deleted) {
        setOfferings((prev) =>
          prev.filter((o) => !(o.semesterCode === deleted.semesterCode && o.section === deleted.section)),
        );
      }
    } catch (err: any) {
      console.error("Failed to delete bookmark:", err);
      alert("Failed to remove bookmark: " + err.message);
    }
  };

  const handleRowClick = (bookmark: Bookmark) => {
    const { deptId, courseId, semesterCode } = bookmark;
    router.push(`/browse/departments/${deptId}/courses/${courseId}/offerings/${semesterCode}`);
  };

  const handleSaveProfile = async () => {
    try {
      await supabase.auth.updateUser({ data: { display_name: displayName } });
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    setPasswordStatus(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordStatus("Password updated");
      setNewPassword("");
      setShowPasswordChange(false);
    } catch (err: any) {
      setPasswordStatus(err.message || "Failed to update password");
    }
  };

  const handleEmailToggle = async () => {
    const newValue = !emailNotificationsEnabled;
    setEmailToggleUpdating(true);
    try {
      const updated = await api.updateEmailNotificationPreference(newValue);
      setEmailNotificationsEnabled(updated.emailNotificationsEnabled);
    } catch (err) {
      console.error("Failed to update email notification preference:", err);
    } finally {
      setEmailToggleUpdating(false);
    }
  };

  const handleSavePreferredEmail = async () => {
    if (!editableEmail) return;
    try {
      const updated = await api.updatePreferredEmail(editableEmail);
      setPreferredEmail(updated.userEmail);
      setIsEditingEmail(false);
    } catch (err) {
      console.error("Failed to update preferred email:", err);
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

  const getOffering = (bookmark: Bookmark) => {
    return offerings.find((o) => o.semesterCode === bookmark.semesterCode && o.section === bookmark.section);
  };

  const fillingFast = offerings.filter((o) => o.loadPercent >= 90).length;
  const averageLoad =
    offerings.length > 0 ? Math.round(offerings.reduce((sum, o) => sum + o.loadPercent, 0) / offerings.length) : 0;

  const statCards = [
    { label: "Watching", value: String(bookmarks.length), icon: Eye },
    { label: "Filling Fast", value: String(fillingFast), icon: TrendingUp },
    { label: "Average Load", value: offerings.length > 0 ? `${averageLoad}%` : "—", icon: BarChart3 },
    { label: "Email Alerts", value: emailNotificationsEnabled ? "On" : "Off", icon: Bell },
  ];

  const headerRef = useScrollReveal({ delay: 0 });
  const statsRef = useScrollReveal({ delay: 50 });
  const profileRef = useScrollReveal({ delay: 100 });
  const watchersRef = useScrollReveal({ delay: 150 });

  if (!user && loading) return null;

  return (
    <div className="min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className={`${displayStyles.mdResponsive} text-text-primary`}>Welcome back, {displayName}</h1>
            <p className={`${bodyStyles.md} text-text-muted mt-1`}>
              Track your courses and stay on top of enrollment changes.
            </p>
          </div>
          <Button onClick={() => router.push("/browse")} className="gap-2 mt-4 sm:mt-0 shrink-0">
            <Plus className="w-4 h-4" />
            Add a course
          </Button>
        </div>

        {/* Stat Cards */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-4">
              <CardContent className="p-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className={`${labelStyles.md} text-text-muted`}>{stat.label}</p>
                  <p className={`${headerStyles.md} text-text-primary`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two-column: Profile + Watchlist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div ref={profileRef} className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <CardContent className="p-0">
                <div className="flex justify-center mb-6">
                  <ProfileAvatar name={displayName} size="lg" />
                </div>

                <div className="text-center mb-6">
                  {isEditingProfile ? (
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="text-center mb-2"
                      placeholder="Display Name"
                    />
                  ) : (
                    <h2 className={`${headerStyles.md} text-text-primary mb-2`}>{displayName}</h2>
                  )}

                  <p className={`${bodyStyles.md} text-text-muted mb-1`}>{user?.email}</p>

                  {/* Preferred notification email */}
                  {isEditingEmail ? (
                    <div className="flex items-center gap-2 justify-center mt-1">
                      <Input
                        type="email"
                        value={editableEmail}
                        onChange={(e) => setEditableEmail(e.target.value)}
                        className="max-w-48 h-8"
                        placeholder="Notification email"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSavePreferredEmail}>
                        <Check className="w-4 h-4 text-success" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsEditingEmail(false)}
                      >
                        <X className="w-4 h-4 text-text-muted" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <p className={`${bodyStyles.sm} text-text-subtle`}>
                        {preferredEmail ? `Notifications: ${preferredEmail}` : "No notification email set"}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditableEmail(preferredEmail || user?.email || "");
                          setIsEditingEmail(true);
                        }}
                      >
                        <Pencil className="w-3 h-3 text-text-subtle" />
                      </Button>
                    </div>
                  )}

                  <p className={`${bodyStyles.sm} text-text-subtle mt-2`}>Member since {getMemberSince()}</p>
                </div>

                {/* Edit Profile / Save */}
                <Button
                  variant="outline"
                  onClick={isEditingProfile ? handleSaveProfile : () => setIsEditingProfile(true)}
                  className="w-full mb-3 text-accent border-accent/30 hover:border-accent"
                >
                  {isEditingProfile ? "Save Profile" : "Edit Profile"}
                </Button>

                {/* Change Password */}
                <Button
                  variant="ghost"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="w-full text-text-muted gap-1"
                >
                  Change Password
                  {showPasswordChange ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {showPasswordChange && (
                  <div className="mt-3 space-y-3">
                    <Input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleChangePassword}>
                      Update Password
                    </Button>
                    {passwordStatus && (
                      <p
                        className={`${bodyStyles.sm} text-center ${passwordStatus === "Password updated" ? "text-success" : "text-destructive"}`}
                      >
                        {passwordStatus}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Watchlist */}
          <div ref={watchersRef} className="lg:col-span-2">
            <Card className="p-6">
              <CardContent className="p-0">
                {/* Watchlist Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`${headerStyles.lg} text-text-primary`}>
                    Watchlist{" "}
                    <span className={`${headerStyles.sm} text-text-subtle`}>({bookmarks.length})</span>
                  </h2>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={emailNotificationsEnabled}
                      onCheckedChange={handleEmailToggle}
                      disabled={emailToggleUpdating}
                      size="sm"
                      aria-label="Toggle email alerts"
                    />
                    <span className={`${labelStyles.md} text-text-muted`}>Email alerts</span>
                  </div>
                </div>

                {loading && <LoadingSpinner />}
                {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

                {!loading && !error && (
                  <>
                    {bookmarks.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center">
                          <Eye className="w-10 h-10 text-accent" />
                        </div>
                        <h3 className={`${headerStyles.md} text-text-primary mb-2`}>No watchers yet</h3>
                        <p className={`${bodyStyles.md} text-text-muted mb-6`}>
                          Browse courses to track enrollment and updates
                        </p>
                        <Button onClick={() => router.push("/browse")}>Browse Courses</Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Course</TableHead>
                              <TableHead>Section / Term</TableHead>
                              <TableHead className="text-right">Load</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookmarks.map((bookmark) => {
                              const courseInfo = getCourseInfo(bookmark);
                              const offering = getOffering(bookmark);

                              return (
                                <TableRow
                                  key={bookmark.bookmarkId}
                                  onClick={() => handleRowClick(bookmark)}
                                  className="cursor-pointer"
                                >
                                  {/* Course column: code + badge, title below */}
                                  <TableCell>
                                    {courseInfo ? (
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className={`${labelStyles.lg} text-text-primary`}>
                                            {courseInfo.deptCode} {courseInfo.courseNumber}
                                          </span>
                                          {offering && (
                                            <StatusBadge status={getStatusFromLoad(offering.loadPercent)} />
                                          )}
                                        </div>
                                        <div className={`${bodyStyles.sm} text-text-muted truncate max-w-xs mt-0.5`}>
                                          {toTitleCase(courseInfo.title)}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className={`${bodyStyles.md} text-text-subtle`}>Loading...</span>
                                    )}
                                  </TableCell>

                                  {/* Section / Term stacked */}
                                  <TableCell>
                                    <div>
                                      <div className={`${labelStyles.lg} text-text-primary`}>{bookmark.section}</div>
                                      {offering ? (
                                        <div className={`${bodyStyles.sm} text-text-muted mt-0.5`}>
                                          {formatTerm(offering.term, offering.year)}
                                        </div>
                                      ) : (
                                        <span className={`${bodyStyles.sm} text-text-subtle`}>—</span>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Load */}
                                  <TableCell className="text-right">
                                    {offering ? (
                                      <LoadBar percent={offering.loadPercent} />
                                    ) : (
                                      <span className={`${bodyStyles.md} text-text-subtle`}>—</span>
                                    )}
                                  </TableCell>

                                  {/* Delete */}
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(bookmark.bookmarkId);
                                      }}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      title="Remove watcher"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardPageContent />
    </Suspense>
  );
}
