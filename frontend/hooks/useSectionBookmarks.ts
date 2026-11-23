"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
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
 * BookmarkButton on it. A failed fetch is treated as "no bookmarks" (with a toast offering a retry) so the page still works.
 */
export function useSectionBookmarks(): SectionBookmarks {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [loaded, setLoaded] = useState<{ userId: string; bookmarks: Bookmark[] } | null>(null);
  const { requestVersion, retry } = useRetryableRequest();

  useEffect(() => {
    if (!userId) return;
    let active = true;
    api
      .getBookmarks()
      .then((bookmarks) => {
        if (active) setLoaded({ userId, bookmarks });
      })
      .catch(() => {
        if (!active) return;
        setLoaded({ userId, bookmarks: [] });
        toast.error("Couldn't load your bookmarks.", { action: { label: "Try again", onClick: retry } });
      });
    return () => {
      active = false;
    };
  }, [userId, requestVersion, retry]);

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
