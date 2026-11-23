"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark as BookmarkIcon } from "lucide-react";
import { toast } from "sonner";
import { buttonStyles } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { SectionBookmarks, SectionKey } from "@/hooks/useSectionBookmarks";
import { buildLoginPath } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps extends SectionKey {
  /** Shared bookmark state for the page (from useSectionBookmarks). */
  bookmarks: SectionBookmarks;
  /** Human label for toasts, e.g. "CMPT 225 D100". */
  label: string;
  onBookmarkChange?: () => void;
}

export default function BookmarkButton({ bookmarks, label, onBookmarkChange, ...key }: BookmarkButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const existing = bookmarks.find(key);
  const isBookmarked = Boolean(existing);

  const handleClick = async () => {
    if (!bookmarks.signedIn) {
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      router.push(buildLoginPath(currentPath));
      return;
    }

    setPending(true);
    try {
      if (existing) {
        await bookmarks.remove(existing);
        toast.success(`Removed ${label} from your bookmarks.`);
      } else {
        await bookmarks.add(key);
        toast.success(`Bookmarked ${label}. It will be in tomorrow's email.`);
      }
      onBookmarkChange?.();
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      toast.error(existing ? `Couldn't remove ${label}: ${reason}` : `Couldn't bookmark ${label}: ${reason}`);
    } finally {
      setPending(false);
    }
  };

  const busy = pending || !bookmarks.ready;

  return (
    <Button
      variant={isBookmarked ? "secondary" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={bookmarks.signedIn ? isBookmarked : undefined}
      className={cn(buttonStyles.md, "min-w-30 justify-center")}
    >
      {busy ? (
        <Spinner aria-hidden="true" role="presentation" aria-label={undefined} />
      ) : (
        <BookmarkIcon aria-hidden="true" className={cn(isBookmarked && "fill-current text-primary")} />
      )}
      {isBookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}
