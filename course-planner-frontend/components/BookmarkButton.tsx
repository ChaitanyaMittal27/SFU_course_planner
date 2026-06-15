"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { buttonStyles } from "@/app/fonts";

interface BookmarkButtonProps {
  deptId: number;
  courseId: number;
  semesterCode: number;
  section: string;
  onBookmarkChange?: () => void;
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

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    checkAuth();
  }, []);

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
            b.deptId === deptId &&
            b.courseId === courseId &&
            b.semesterCode === semesterCode &&
            b.section === section
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

  const handleClick = async () => {
    if (!user) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (isBookmarked) return;

    try {
      setLoading(true);
      await api.createBookmark(deptId, courseId, semesterCode, section);
      setIsBookmarked(true);
      onBookmarkChange?.();
    } catch (err: any) {
      console.error("Failed to add bookmark:", err);
      alert("Failed to add bookmark: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Button variant="ghost" disabled className={buttonStyles.md}>
        ...
      </Button>
    );
  }

  if (isBookmarked) {
    return (
      <Button
        disabled
        className={`${buttonStyles.md} bg-success/10 text-success border border-success/20 cursor-not-allowed`}
        title="Already bookmarked — remove from dashboard to unbookmark"
      >
        <Bookmark className="w-4 h-4 fill-current" />
        Bookmarked
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={`${buttonStyles.md} bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20`}
      title={user ? "Bookmark this section" : "Login to bookmark"}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4" />
          Bookmark
        </>
      )}
    </Button>
  );
}
