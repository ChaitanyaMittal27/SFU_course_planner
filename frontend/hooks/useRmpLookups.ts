"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { RmpLookup } from "@/lib/types";

/**
 * Rate My Professors lookups for instructor names in one department.
 *
 * - Results are cached in memory for the browser tab, keyed by department + name, so
 *   reopening a page (or the compare page for the same course) does not refetch.
 *   Requests already in flight are shared.
 * - Only MATCHED and NO_MATCH results stay cached; UNAVAILABLE and request errors are
 *   dropped so a retry really asks again.
 * - At most MAX_CONCURRENT requests run at once. A course's first-ever view triggers
 *   RMP searches on the backend, which share a small thread pool there.
 */

export const MAX_CONCURRENT_RMP_REQUESTS = 3;

export type RmpLookupState =
  | { status: "loading" }
  | { status: "loaded"; lookup: RmpLookup }
  | { status: "error" };

type SettledState = Exclude<RmpLookupState, { status: "loading" }>;

const cache = new Map<string, Promise<RmpLookup>>();
const waiting: Array<() => void> = [];
let running = 0;

function cacheKey(name: string, deptCode: string) {
  return `${deptCode.toLowerCase()}|${name}`;
}

function limit<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      running += 1;
      // Promise.resolve().then(task) turns a synchronous throw into a rejection.
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          running -= 1;
          waiting.shift()?.();
        });
    };
    if (running < MAX_CONCURRENT_RMP_REQUESTS) run();
    else waiting.push(run);
  });
}

function loadRmp(name: string, deptCode: string): Promise<RmpLookup> {
  const key = cacheKey(name, deptCode);
  const cached = cache.get(key);
  if (cached) return cached;

  const request = limit(() => api.getRmp(name, deptCode)).then(
    (lookup) => {
      if (lookup.status === "UNAVAILABLE") cache.delete(key);
      return lookup;
    },
    (error: unknown) => {
      cache.delete(key);
      throw error;
    },
  );
  cache.set(key, request);
  return request;
}

/** Test helper: forget every cached or in-flight lookup. */
export function clearRmpLookupCache() {
  cache.clear();
}

export function useRmpLookups(names: string[], deptCode: string) {
  const [settled, setSettled] = useState<Record<string, SettledState>>({});
  const mounted = useRef(true);
  const namesKey = names.join("\n");

  const settle = useCallback((key: string, state: SettledState) => {
    if (mounted.current) setSettled((previous) => ({ ...previous, [key]: state }));
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    for (const name of namesKey === "" ? [] : namesKey.split("\n")) {
      const key = cacheKey(name, deptCode);
      loadRmp(name, deptCode).then(
        (lookup) => active && settle(key, { status: "loaded", lookup }),
        () => active && settle(key, { status: "error" }),
      );
    }
    return () => {
      active = false;
    };
  }, [namesKey, deptCode, settle]);

  const retry = useCallback(
    (name: string) => {
      const key = cacheKey(name, deptCode);
      setSettled((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
      loadRmp(name, deptCode).then(
        (lookup) => settle(key, { status: "loaded", lookup }),
        () => settle(key, { status: "error" }),
      );
    },
    [deptCode, settle],
  );

  const lookups: Record<string, RmpLookupState> = {};
  for (const name of names) {
    lookups[name] = settled[cacheKey(name, deptCode)] ?? { status: "loading" };
  }
  return { lookups, retry };
}
