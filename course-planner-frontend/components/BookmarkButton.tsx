"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, Bookmark } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";

interface BookmarkButtonProps {
  deptId: number;
  courseId: number;
  semesterCode: number;
  section: string;
  onBookmarkChange?: () => void; // Optional callback for refresh
}

export default function BookmarkButton({
  deptId,
  courseId,
  semesterCode,
  section,
  onBookmarkChange,
}: BookmarkButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }

    checkAuth();
  }, []);

  // Check if this section is already bookmarked
  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    async function checkBookmark() {
      try {
        const bookmarks = await api.getBookmarks();
        const exists = bookmarks.some(
          (b) =>
            b.deptId === deptId && b.courseId === courseId && b.semesterCode === semesterCode && b.section === section
        );
        setIsBookmarked(exists);
      } catch (err) {
        console.error("Failed to check bookmark:", err);
      } finally {
        setChecking(false);
      }
    }

    checkBookmark();
  }, [user, deptId, courseId, semesterCode, section]);

  // Handle bookmark action
  const handleClick = async () => {
    // Not logged in - redirect to login
    if (!user) {
      const currentPath = window.location.pathname;
      // FIXED: Changed returnTo to redirectTo to match login page
      router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Already bookmarked - do nothing (can only delete from dashboard)
    if (isBookmarked) {
      return;
    }

    // Add bookmark
    try {
      setLoading(true);

      await api.createBookmark(deptId, courseId, semesterCode, section);

      setIsBookmarked(true);

      // Success feedback
      console.log("Bookmark added successfully");

      // Call optional callback
      if (onBookmarkChange) {
        onBookmarkChange();
      }
    } catch (err: any) {
      console.error("Failed to add bookmark:", err);
      alert("Failed to add bookmark: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking
  if (checking) {
    return (
      <button disabled className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-400 text-sm">
        ...
      </button>
    );
  }

  // Already bookmarked - show disabled state
  if (isBookmarked) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium cursor-not-allowed"
        title="Already bookmarked - remove from dashboard to unbookmark"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Bookmarked
      </button>
    );
  }

  // Not bookmarked - show add button
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        loading
          ? "bg-gray-300 dark:bg-slate-600 text-gray-500 cursor-not-allowed"
          : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50"
      }`}
      title={user ? "Bookmark this section" : "Login to bookmark"}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Adding...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          Bookmark
        </>
      )}
    </button>
  );
}
