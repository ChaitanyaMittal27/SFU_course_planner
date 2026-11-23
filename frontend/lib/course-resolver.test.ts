import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getDepartments: vi.fn(),
  getCourses: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: apiMocks,
}));

const departments = [{ deptId: 14, deptCode: "CMPT", name: "Computing Science" }];
const courses = [{
  courseId: 3998,
  deptId: 14,
  courseNumber: "225",
  title: "Data Structures",
  description: null,
  units: 3,
  degreeLevel: "UGRD",
  prerequisites: null,
  corequisites: null,
  designation: null,
}];

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  apiMocks.getDepartments.mockResolvedValue(departments);
  apiMocks.getCourses.mockResolvedValue(courses);
});

describe("course route resolution", () => {
  it("resolves readable course identities to backend IDs", async () => {
    const { resolveCourseIdentity } = await import("@/lib/course-resolver");

    await expect(resolveCourseIdentity({ deptCode: "cmpt", courseNumber: "225" })).resolves.toMatchObject({
      deptId: 14,
      courseId: 3998,
      deptCode: "cmpt",
      courseNumber: "225",
    });
    expect(apiMocks.getDepartments).toHaveBeenCalledOnce();
    expect(apiMocks.getCourses).toHaveBeenCalledWith(14);
  });

  it("returns null for invalid, missing department, and missing course routes", async () => {
    const { resolveCourseIdentity, resolveCourseIds } = await import("@/lib/course-resolver");

    await expect(resolveCourseIdentity({ deptCode: "CMPT", courseNumber: "2" })).resolves.toBeNull();
    expect(apiMocks.getDepartments).not.toHaveBeenCalled();

    apiMocks.getDepartments.mockResolvedValueOnce([]);
    await expect(resolveCourseIdentity({ deptCode: "CMPT", courseNumber: "225" })).resolves.toBeNull();
    await expect(resolveCourseIds(14, 0)).resolves.toBeNull();
  });

  it("deduplicates department and course lookups for repeated resolutions", async () => {
    const { resolveCourseIdentity, resolveCourseIds } = await import("@/lib/course-resolver");

    await Promise.all([
      resolveCourseIdentity({ deptCode: "CMPT", courseNumber: "225" }),
      resolveCourseIds(14, 3998),
    ]);

    expect(apiMocks.getDepartments).toHaveBeenCalledOnce();
    expect(apiMocks.getCourses).toHaveBeenCalledOnce();
  });

  it("propagates API failures instead of inventing a route result", async () => {
    apiMocks.getDepartments.mockRejectedValueOnce(new Error("API unavailable"));
    const { resolveCourseIdentity } = await import("@/lib/course-resolver");

    await expect(resolveCourseIdentity({ deptCode: "CMPT", courseNumber: "225" })).rejects.toThrow("API unavailable");
  });

  it("does not cache a failed lookup, so a retry calls the API again", async () => {
    apiMocks.getDepartments.mockRejectedValueOnce(new Error("API unavailable"));
    apiMocks.getCourses.mockRejectedValueOnce(new Error("API unavailable"));
    const { resolveCourseIdentity } = await import("@/lib/course-resolver");

    await expect(resolveCourseIdentity({ deptCode: "CMPT", courseNumber: "225" })).rejects.toThrow();
    await expect(resolveCourseIdentity({ deptCode: "CMPT", courseNumber: "225" })).rejects.toThrow();
    await expect(resolveCourseIdentity({ deptCode: "CMPT", courseNumber: "225" })).resolves.toMatchObject({ courseId: 3998 });
    expect(apiMocks.getDepartments).toHaveBeenCalledTimes(2);
    expect(apiMocks.getCourses).toHaveBeenCalledTimes(2);
  });
});
