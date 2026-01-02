"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, CourseOffering, Bookmark, Course, Department } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmailNotificationToggle from "@/components/Emailnotificationtoggle";

function DashboardPageContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [courses, setCourses] = useState<Map<number, Course>>(new Map());
  const [departments, setDepartments] = useState<Map<number, Department>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Check authentication
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

  // Load bookmarks + course data
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all departments first (needed for deptCode lookup)
        const allDepartments = await api.getDepartments();
        const deptMap = new Map(allDepartments.map((d) => [d.deptId, d]));
        setDepartments(deptMap);

        // Get bookmarks and offerings
        const [bookmarkData, offeringData] = await Promise.all([api.getBookmarks(), api.getBookmarkOfferings()]);

        setBookmarks(bookmarkData);
        setOfferings(offeringData);

        // Extract unique deptIds and fetch courses
        const uniqueDeptIds = [...new Set(bookmarkData.map((b) => b.deptId))];

        const coursesMap = new Map<number, Course>();

        await Promise.all(
          uniqueDeptIds.map(async (deptId) => {
            try {
              const deptCourses = await api.getCourses(deptId);
              deptCourses.forEach((course) => {
                coursesMap.set(course.courseId, course);
              });
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

  // Handle delete bookmark
  const handleDelete = async (bookmarkId: number) => {
    try {
      await api.deleteBookmark(bookmarkId);

      setBookmarks((prev) => prev.filter((b) => b.bookmarkId !== bookmarkId));

      const deletedBookmark = bookmarks.find((b) => b.bookmarkId === bookmarkId);
      if (deletedBookmark) {
        setOfferings((prev) =>
          prev.filter(
            (o) => !(o.semesterCode === deletedBookmark.semesterCode && o.section === deletedBookmark.section)
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to delete bookmark:", err);
      alert("Failed to remove bookmark: " + err.message);
    }
  };

  // Handle navigate to offering detail
  const handleRowClick = (bookmark: Bookmark) => {
    const { deptId, courseId, semesterCode } = bookmark;
    router.push(`/browse/departments/${deptId}/courses/${courseId}/offerings/${semesterCode}`);
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format member since date
  const getMemberSince = () => {
    if (!user?.created_at) return "Recently";
    const date = new Date(user.created_at);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Get course info for display
  const getCourseInfo = (bookmark: Bookmark) => {
    const course = courses.get(bookmark.courseId);
    const dept = departments.get(bookmark.deptId);

    if (!course || !dept) return null;

    return {
      deptCode: dept.deptCode,
      courseNumber: course.courseNumber,
      title: course.title || "Untitled Course",
    };
  };

  // Get matching offering for bookmark
  const getOffering = (bookmark: Bookmark) => {
    return offerings.find((o) => o.semesterCode === bookmark.semesterCode && o.section === bookmark.section);
  };

  if (!user && loading) {
    return null;
  }

  return (
    <div className="min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT SIDE - Profile Section */}
          <div className="lg:col-span-1">
            <div className="light-card dark:dark-card p-6 sticky top-24">
              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {getInitials(displayName)}
                </div>
              </div>

              {/* User Info */}
              <div className="text-center mb-6">
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field text-center mb-2"
                    placeholder="Display Name"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{displayName}</h2>
                )}

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{user?.email}</p>

                <p className="text-gray-500 dark:text-gray-500 text-xs">Member since {getMemberSince()}</p>
              </div>

              {/* Edit Profile Button */}
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="w-full mb-3 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
              >
                {isEditingProfile ? "Save Profile" : "Edit Profile"}
              </button>

              {/* Change Password Expandable */}
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Change Password {showPasswordChange ? "▲" : "▼"}
              </button>

              {showPasswordChange && (
                <div className="mt-3 space-y-3">
                  <input type="password" placeholder="Current password" className="input-field text-sm" />
                  <input type="password" placeholder="New password" className="input-field text-sm" />
                  <button className="w-full px-4 py-2 btn-primary text-sm">Update Password</button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - Bookmarks Section */}
          <div className="lg:col-span-3">
            <div className="light-card dark:dark-card p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Bookmarks <span className="text-gray-500 dark:text-gray-400 text-lg">({bookmarks.length})</span>
                </h2>

                <EmailNotificationToggle />
                <button
                  onClick={() => router.push("/browse")}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Watcher
                </button>
              </div>

              {/* Loading State */}
              {loading && <LoadingSpinner />}

              {/* Error State */}
              {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

              {/* Content */}
              {!loading && !error && (
                <>
                  {bookmarks.length === 0 ? (
                    // Empty State
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-orange-600 dark:text-orange-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No watchers yet</h3>

                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Browse courses to track enrollment and updates
                      </p>

                      <button
                        onClick={() => router.push("/browse")}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
                      >
                        Browse Courses
                      </button>
                    </div>
                  ) : (
                    // Bookmarks Table
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-slate-700">
                            <th className="table-header text-left">Course</th>
                            <th className="table-header text-left">Section</th>
                            <th className="table-header text-left">Term</th>
                            <th className="table-header text-right">Enrolled</th>
                            <th className="table-header text-right">Load</th>
                            <th className="table-header text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookmarks.map((bookmark) => {
                            const courseInfo = getCourseInfo(bookmark);
                            const offering = getOffering(bookmark);

                            return (
                              <tr
                                key={bookmark.bookmarkId}
                                onClick={() => handleRowClick(bookmark)}
                                className="table-row cursor-pointer"
                              >
                                <td className="table-cell">
                                  {courseInfo ? (
                                    <div>
                                      <div className="font-semibold text-gray-900 dark:text-white">
                                        {courseInfo.deptCode} {courseInfo.courseNumber}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                        {courseInfo.title}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">Loading...</span>
                                  )}
                                </td>

                                <td className="table-cell">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {bookmark.section}
                                  </span>
                                </td>

                                <td className="table-cell">
                                  {offering ? (
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {offering.term} {offering.year}
                                      </div>
                                      {offering.isEnrolling && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                                          Enrolling
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>

                                <td className="table-cell text-right">
                                  {offering ? (
                                    <span className="text-gray-900 dark:text-white font-medium">
                                      {offering.enrolled}/{offering.capacity}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>

                                <td className="table-cell text-right">
                                  {offering ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-20 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full ${
                                            offering.loadPercent >= 95
                                              ? "bg-red-500"
                                              : offering.loadPercent >= 80
                                              ? "bg-yellow-500"
                                              : "bg-green-500"
                                          }`}
                                          style={{ width: `${Math.min(offering.loadPercent, 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                                        {offering.loadPercent}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>

                                <td className="table-cell text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(bookmark.bookmarkId);
                                    }}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                    title="Remove watcher"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
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
