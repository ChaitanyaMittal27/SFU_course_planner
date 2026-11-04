import { describe, expect, it } from "vitest";
import { groupSectionsByInstructor, instructorDisplayName, parseRmpProfessorUrl, splitInstructors } from "@/lib/instructors";
import type { CourseOffering } from "@/lib/types";

function section(label: string, instructors: string): CourseOffering {
  return {
    section: label, infoUrl: "", term: "fall", year: 2026, semesterCode: 1267, isEnrolling: true,
    location: "Burnaby", instructors, enrolled: "10", capacity: "20", loadPercent: 50,
  };
}

describe("instructor helpers", () => {
  it("splits co-taught cells and drops placeholders and blanks", () => {
    expect(splitInstructors("Fraser, Brian; Doe,  John ")).toEqual(["Fraser, Brian", "Doe, John"]);
    expect(splitInstructors("TBA")).toEqual([]);
    expect(splitInstructors(" staff ; ;To Be Announced")).toEqual([]);
    expect(splitInstructors("")).toEqual([]);
    expect(splitInstructors(null)).toEqual([]);
  });

  it("formats CourseSys names the way the backend does", () => {
    expect(instructorDisplayName("Hall, Margaret")).toBe("Margaret Hall");
    expect(instructorDisplayName("Ternovska, Evgenia (Eugenia)")).toBe("Evgenia Ternovska");
    expect(instructorDisplayName("de Silva, Ana Maria")).toBe("Ana Maria de Silva");
    expect(instructorDisplayName("Madonna")).toBe("Madonna");
  });

  it("groups sections per unique instructor and lists co-taught sections under each", () => {
    const groups = groupSectionsByInstructor([
      section("CMPT 120 D100", "Fraser, Brian"),
      section("CMPT 120 D200", "Fraser, Brian"),
      section("CMPT 120 D300", "Fraser, Brian; Doe, John"),
      section("CMPT 120 D400", "TBA"),
    ]);
    expect(groups).toEqual([
      { name: "Fraser, Brian", sections: ["D100", "D200", "D300"] },
      { name: "Doe, John", sections: ["D300"] },
    ]);
  });
});

describe("parseRmpProfessorUrl", () => {
  it("reads the professor ID from profile links", () => {
    expect(parseRmpProfessorUrl("https://www.ratemyprofessors.com/professor/3030010")).toBe(3030010);
    expect(parseRmpProfessorUrl("  http://ratemyprofessors.com/professor/3030010/  ")).toBe(3030010);
    expect(parseRmpProfessorUrl("www.ratemyprofessors.com/professor/42?tab=ratings")).toBe(42);
    expect(parseRmpProfessorUrl("ratemyprofessors.com/professor/42#reviews")).toBe(42);
    expect(parseRmpProfessorUrl("HTTPS://WWW.RateMyProfessors.com/professor/7")).toBe(7);
  });

  it("rejects anything that is not a professor profile link", () => {
    for (const text of [
      "",
      "3030010",
      "https://www.ratemyprofessors.com/search/professors/1482?q=Claudia",
      "https://www.ratemyprofessors.com/professor/",
      "https://www.ratemyprofessors.com/professor/abc",
      "https://www.ratemyprofessors.com/professor/0",
      "https://www.ratemyprofessors.com/professor/99999999999",
      "https://evil.example/ratemyprofessors.com/professor/3030010",
      "https://ratemyprofessors.com.evil.example/professor/3030010",
    ]) {
      expect(parseRmpProfessorUrl(text)).toBeNull();
    }
  });
});
