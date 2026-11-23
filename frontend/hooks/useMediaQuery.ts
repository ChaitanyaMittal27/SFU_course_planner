"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Whether a CSS media query matches. False on the server and where matchMedia is unavailable. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      const media = typeof window !== "undefined" ? window.matchMedia?.(query) : undefined;
      media?.addEventListener?.("change", listener);
      return () => media?.removeEventListener?.("change", listener);
    },
    [query],
  );
  const getSnapshot = () => (typeof window !== "undefined" ? window.matchMedia?.(query).matches ?? false : false);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
