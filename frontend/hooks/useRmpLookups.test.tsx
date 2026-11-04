import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RmpLookup } from "@/lib/types";

const mocks = vi.hoisted(() => ({ getRmp: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { getRmp: mocks.getRmp } }));

import { MAX_CONCURRENT_RMP_REQUESTS, clearRmpLookupCache, useRmpLookups } from "@/hooks/useRmpLookups";

function lookup(status: RmpLookup["status"], lookupId: number | null = 1): RmpLookup {
  return { status, lookupId, searchName: "Margaret Hall", searchUrl: "https://rmp.test/search", teacher: null };
}

beforeEach(() => {
  vi.clearAllMocks();
  clearRmpLookupCache();
});

describe("useRmpLookups", () => {
  it("starts loading, then settles each name", async () => {
    mocks.getRmp.mockResolvedValue(lookup("NO_MATCH"));
    const { result } = renderHook(() => useRmpLookups(["Hall, Margaret"], "als"));

    expect(result.current.lookups["Hall, Margaret"]).toEqual({ status: "loading" });
    await waitFor(() =>
      expect(result.current.lookups["Hall, Margaret"]).toEqual({ status: "loaded", lookup: lookup("NO_MATCH") }),
    );
    expect(mocks.getRmp).toHaveBeenCalledWith("Hall, Margaret", "als");
  });

  it("shares in-flight requests and reuses cached results across mounts", async () => {
    mocks.getRmp.mockResolvedValue(lookup("MATCHED"));
    const first = renderHook(() => useRmpLookups(["Hall, Margaret"], "als"));
    const second = renderHook(() => useRmpLookups(["Hall, Margaret"], "ALS"));
    await waitFor(() => expect(second.result.current.lookups["Hall, Margaret"].status).toBe("loaded"));
    first.unmount();
    second.unmount();

    const third = renderHook(() => useRmpLookups(["Hall, Margaret"], "als"));
    await waitFor(() => expect(third.result.current.lookups["Hall, Margaret"].status).toBe("loaded"));
    expect(mocks.getRmp).toHaveBeenCalledTimes(1);
  });

  it(`runs at most ${MAX_CONCURRENT_RMP_REQUESTS} requests at once`, async () => {
    const pending: Array<(value: RmpLookup) => void> = [];
    let inFlight = 0;
    let peak = 0;
    mocks.getRmp.mockImplementation(
      () =>
        new Promise<RmpLookup>((resolve) => {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          pending.push((value) => {
            inFlight -= 1;
            resolve(value);
          });
        }),
    );
    const names = ["A, One", "B, Two", "C, Three", "D, Four", "E, Five"];
    const { result } = renderHook(() => useRmpLookups(names, "cmpt"));

    await waitFor(() => expect(mocks.getRmp).toHaveBeenCalledTimes(MAX_CONCURRENT_RMP_REQUESTS));
    while (pending.length > 0) {
      await act(async () => pending.shift()?.(lookup("NO_MATCH")));
    }
    await waitFor(() => expect(mocks.getRmp).toHaveBeenCalledTimes(names.length));
    while (pending.length > 0) {
      await act(async () => pending.shift()?.(lookup("NO_MATCH")));
    }
    await waitFor(() => expect(Object.values(result.current.lookups).every((s) => s.status === "loaded")).toBe(true));
    expect(peak).toBe(MAX_CONCURRENT_RMP_REQUESTS);
  });

  it("does not cache UNAVAILABLE or failed lookups, and retry asks again", async () => {
    mocks.getRmp.mockResolvedValueOnce(lookup("UNAVAILABLE", null)).mockResolvedValueOnce(lookup("MATCHED"));
    const { result } = renderHook(() => useRmpLookups(["Hall, Margaret"], "als"));
    await waitFor(() => expect(result.current.lookups["Hall, Margaret"]).toEqual({ status: "loaded", lookup: lookup("UNAVAILABLE", null) }));

    act(() => result.current.retry("Hall, Margaret"));
    expect(result.current.lookups["Hall, Margaret"]).toEqual({ status: "loading" });
    await waitFor(() => expect(result.current.lookups["Hall, Margaret"]).toEqual({ status: "loaded", lookup: lookup("MATCHED") }));
    expect(mocks.getRmp).toHaveBeenCalledTimes(2);

    mocks.getRmp.mockRejectedValueOnce(new Error("network"));
    const other = renderHook(() => useRmpLookups(["Yip, Karen"], "als"));
    await waitFor(() => expect(other.result.current.lookups["Yip, Karen"]).toEqual({ status: "error" }));
    mocks.getRmp.mockResolvedValueOnce(lookup("NO_MATCH"));
    act(() => other.result.current.retry("Yip, Karen"));
    await waitFor(() => expect(other.result.current.lookups["Yip, Karen"].status).toBe("loaded"));
  });

  it("ignores results that arrive after unmount", async () => {
    let finish: (value: RmpLookup) => void = () => {};
    mocks.getRmp.mockReturnValue(new Promise<RmpLookup>((resolve) => (finish = resolve)));
    const errors = vi.spyOn(console, "error");
    const { unmount } = renderHook(() => useRmpLookups(["Hall, Margaret"], "als"));
    unmount();

    await act(async () => finish(lookup("MATCHED")));
    expect(errors).not.toHaveBeenCalled();
  });
});
