import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resolverMocks = vi.hoisted(() => ({ resolveCourseIdentity: vi.fn() }));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIdentity: resolverMocks.resolveCourseIdentity }));

import { useCourseRouteResolution } from "@/hooks/useCourseRouteResolution";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRetryableRequest", () => {
  it("increments the request version through a stable retry callback", () => {
    const { result, rerender } = renderHook(() => useRetryableRequest());
    const initialRetry = result.current.retry;
    expect(result.current.requestVersion).toBe(0);

    act(() => result.current.retry());
    expect(result.current.requestVersion).toBe(1);
    rerender();
    expect(result.current.retry).toBe(initialRetry);
  });
});

describe("useCourseRouteResolution", () => {
  it("rejects malformed route segments without resolving them", () => {
    const { result } = renderHook(() => useCourseRouteResolution("CMPT", "invalid"));
    expect(result.current).toMatchObject({ status: "invalid" });
    expect(resolverMocks.resolveCourseIdentity).not.toHaveBeenCalled();
  });

  it("moves from loading to resolved with the backend identity", async () => {
    resolverMocks.resolveCourseIdentity.mockResolvedValue({ deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225" });
    const { result } = renderHook(() => useCourseRouteResolution("CMPT", "225"));
    expect(result.current).toMatchObject({ status: "loading" });

    await waitFor(() => expect(result.current).toMatchObject({ status: "resolved", course: { deptId: 14, courseId: 3998 } }));
    expect(resolverMocks.resolveCourseIdentity).toHaveBeenCalledWith({ deptCode: "cmpt", courseNumber: "225" });
  });

  it("reports not found and resolution failures distinctly", async () => {
    resolverMocks.resolveCourseIdentity.mockResolvedValueOnce(null);
    const notFound = renderHook(() => useCourseRouteResolution("CMPT", "225"));
    await waitFor(() => expect(notFound.result.current).toMatchObject({ status: "notFound" }));
    notFound.unmount();

    resolverMocks.resolveCourseIdentity.mockRejectedValueOnce(new Error("offline"));
    const failed = renderHook(() => useCourseRouteResolution("CMPT", "225"));
    await waitFor(() => expect(failed.result.current).toMatchObject({ status: "error" }));
  });

  it("re-runs a failed resolution on retry", async () => {
    resolverMocks.resolveCourseIdentity
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225" });
    const { result } = renderHook(() => useCourseRouteResolution("CMPT", "225"));
    await waitFor(() => expect(result.current).toMatchObject({ status: "error" }));

    act(() => result.current.retry());
    expect(result.current).toMatchObject({ status: "loading" });
    await waitFor(() => expect(result.current).toMatchObject({ status: "resolved", course: { courseId: 3998 } }));
    expect(resolverMocks.resolveCourseIdentity).toHaveBeenCalledTimes(2);
  });

  it("does not let an earlier route result replace a newer route", async () => {
    let resolveFirst!: (value: unknown) => void;
    resolverMocks.resolveCourseIdentity
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ deptId: 14, courseId: 4000, deptCode: "cmpt", courseNumber: "226" });
    const { result, rerender } = renderHook(({ courseNumber }) => useCourseRouteResolution("CMPT", courseNumber), { initialProps: { courseNumber: "225" } });

    rerender({ courseNumber: "226" });
    await waitFor(() => expect(result.current).toMatchObject({ status: "resolved", course: { courseId: 4000 } }));
    resolveFirst({ deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225" });
    await waitFor(() => expect(result.current).toMatchObject({ status: "resolved", course: { courseId: 4000 } }));
  });
});
