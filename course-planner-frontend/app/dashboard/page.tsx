"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, X, ChevronDown, ChevronUp } from "lucide-react";
import { api, CourseOffering, Bookmark, Course, Department } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmailNotificationToggle from "@/components/EmailNotificationToggle";
import ProfileAvatar from "@/components/ProfileAvatar";
import LoadBar from "@/components/LoadBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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

        const [bookmarkData, offeringData] = await Promise.all([api.getBookmarks(), api.getBookmarkOfferings()]);
        setBookmarks(bookmarkData);
        setOfferings(offeringData);

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
          })
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
          prev.filter((o) => !(o.semesterCode === deleted.semesterCode && o.section === deleted.section))
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

  const profileRef = useScrollReveal({ delay: 0 });
  const watchersRef = useScrollReveal({ delay: 100 });

  if (!user && loading) return null;

  return (
    <div className="min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={`${displayStyles.sm} text-text-primary mb-8`}>Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT SIDE - Profile Section */}
          <div ref={profileRef} className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <CardContent className="p-0">
                {/* Profile Picture */}
                <div className="flex justify-center mb-6">
                  <ProfileAvatar name={displayName} size="lg" />
                </div>

                {/* User Info */}
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
                  <p className={`${bodyStyles.sm} text-text-subtle`}>Member since {getMemberSince()}</p>
                </div>

                {/* Edit Profile Button */}
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
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
                    <Input type="password" placeholder="Current password" className="text-sm" />
                    <Input type="password" placeholder="New password" className="text-sm" />
                    <Button className="w-full text-sm">Update Password</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDE - Bookmarks Section */}
          <div ref={watchersRef} className="lg:col-span-3">
            <Card className="p-6">
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`${headerStyles.lg} text-text-primary`}>
                    My Bookmarks{" "}
                    <span className={`${headerStyles.md} text-text-subtle`}>({bookmarks.length})</span>
                  </h2>

                  <div className="flex items-center gap-3">
                    <EmailNotificationToggle />
                    <Button onClick={() => router.push("/browse")} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Watcher
                    </Button>
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
                              <TableHead>Section</TableHead>
                              <TableHead>Term</TableHead>
                              <TableHead className="text-right">Enrolled</TableHead>
                              <TableHead className="text-right">Load</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
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
                                  <TableCell>
                                    {courseInfo ? (
                                      <div>
                                        <div className={`${labelStyles.lg} text-text-primary`}>
                                          {courseInfo.deptCode} {courseInfo.courseNumber}
                                        </div>
                                        <div className={`${bodyStyles.md} text-text-muted truncate max-w-xs`}>
                                          {courseInfo.title}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className={`${bodyStyles.md} text-text-subtle`}>Loading...</span>
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <span className={`${labelStyles.lg} text-text-primary`}>{bookmark.section}</span>
                                  </TableCell>

                                  <TableCell>
                                    {offering ? (
                                      <div>
                                        <div className={`${labelStyles.md} text-text-primary`}>
                                          {offering.term} {offering.year}
                                        </div>
                                        {offering.isEnrolling && (
                                          <span className={`inline-block mt-1 px-2 py-0.5 bg-success/10 text-success ${labelStyles.sm} rounded`}>
                                            Enrolling
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className={`${bodyStyles.md} text-text-subtle`}>-</span>
                                    )}
                                  </TableCell>

                                  <TableCell className="text-right">
                                    {offering ? (
                                      <span className={`${labelStyles.md} text-text-primary`}>
                                        {offering.enrolled}/{offering.capacity}
                                      </span>
                                    ) : (
                                      <span className={`${bodyStyles.md} text-text-subtle`}>-</span>
                                    )}
                                  </TableCell>

                                  <TableCell className="text-right">
                                    {offering ? (
                                      <LoadBar percent={offering.loadPercent} />
                                    ) : (
                                      <span className={`${bodyStyles.md} text-text-subtle`}>-</span>
                                    )}
                                  </TableCell>

                                  <TableCell className="text-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(bookmark.bookmarkId);
                                      }}
                                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                      title="Remove watcher"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
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
