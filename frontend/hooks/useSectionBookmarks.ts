"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { Bookmark } from "@/lib/types";

export interface SectionKey {
  deptId: number;
  courseId: number;
  semesterCode: number;
  section: string;
}

export interface SectionBookmarks {
  /** False while auth or the user's bookmark list is still loading. */
  ready: boolean;
  signedIn: boolean;
  find: (key: SectionKey) => Bookmark | undefined;
  add: (key: SectionKey) => Promise<Bookmark>;
  remove: (bookmark: Bookmark) => Promise<void>;
}

function sameSection(bookmark: Bookmark, key: SectionKey) {
  return (
    bookmark.deptId === key.deptId &&
    bookmark.courseId === key.courseId &&
    bookmark.semesterCode === key.semesterCode &&
    bookmark.section === key.section
  );
}

/**
 * The signed-in user's bookmarks, fetched once per page and shared by every
 * BookmarkButton on it. A failed fetch is treated as "no bookmarks" so the page still works.
 */
export function useSectionBookmarks(): SectionBookmarks {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [loaded, setLoaded] = useState<{ userId: string; bookmarks: Bookmark[] } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    api
      .getBookmarks()
      .then((bookmarks) => {
        if (active) setLoaded({ userId, bookmarks });
      })
      .catch((error: unknown) => {
        console.error("Failed to load bookmarks:", error);
        if (active) setLoaded({ userId, bookmarks: [] });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const bookmarks = loaded && loaded.userId === userId ? loaded.bookmarks : null;
  const ready = !authLoading && (!userId || bookmarks !== null);

  const find = useCallback((key: SectionKey) => bookmarks?.find((b) => sameSection(b, key)), [bookmarks]);

  const add = useCallback(
    async (key: SectionKey) => {
      const created = await api.createBookmark(key.deptId, key.courseId, key.semesterCode, key.section);
      const bookmark: Bookmark = { ...key, ...created };
      setLoaded((prev) => (prev ? { ...prev, bookmarks: [...prev.bookmarks, bookmark] } : prev));
      return bookmark;
    },
    [],
  );

  const remove = useCallback(async (bookmark: Bookmark) => {
    await api.deleteBookmark(bookmark.bookmarkId);
    setLoaded((prev) => (prev ? { ...prev, bookmarks: prev.bookmarks.filter((b) => b.bookmarkId !== bookmark.bookmarkId) } : prev));
  }, []);

  return { ready, signedIn: Boolean(userId), find, add, remove };
}
