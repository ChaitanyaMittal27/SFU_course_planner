import type { CourseOffering } from "@/lib/types";
import { sectionCode } from "@/lib/course-routes";

// CourseSys values that are not a person.
const PLACEHOLDER_NAMES = new Set(["staff", "tba", "tbd", "to be announced"]);

/**
 * Splits a CourseSys instructor cell into individual names.
 * Co-taught sections join names with ";". Placeholders (TBA, Staff) and blanks are dropped.
 * "Fraser, Brian; Doe, John" → ["Fraser, Brian", "Doe, John"]
 */
export function splitInstructors(cell: string | null | undefined): string[] {
  if (!cell) return [];
  return cell
    .split(";")
    .map((name) => name.trim().replace(/\s+/g, " "))
    .filter((name) => name !== "" && !PLACEHOLDER_NAMES.has(name.toLowerCase()));
}

/**
 * "Surname, Given (Alias)" → "Given Surname", matching the backend's display name.
 * "Ternovska, Evgenia (Eugenia)" → "Evgenia Ternovska"
 */
export function instructorDisplayName(rawName: string): string {
  const withoutAlias = rawName.replace(/\([^)]*\)/g, " ");
  const commaIndex = withoutAlias.indexOf(",");
  const ordered =
    commaIndex === -1
      ? withoutAlias
      : `${withoutAlias.slice(commaIndex + 1)} ${withoutAlias.slice(0, commaIndex)}`;
  return ordered.trim().replace(/\s+/g, " ");
}

export interface InstructorSections {
  /** Raw CourseSys name, sent as-is to /api/rmp. */
  name: string;
  /** Short section codes this instructor teaches, e.g. ["D100", "D200"]. */
  sections: string[];
}

/**
 * One entry per unique instructor across the given sections, in first-seen order.
 * A co-taught section appears under each of its instructors.
 */
export function groupSectionsByInstructor(sections: CourseOffering[]): InstructorSections[] {
  const byName = new Map<string, InstructorSections>();
  for (const section of sections) {
    const code = sectionCode(section.section);
    for (const name of splitInstructors(section.instructors)) {
      const entry = byName.get(name) ?? { name, sections: [] };
      if (!entry.sections.includes(code)) entry.sections.push(code);
      byName.set(name, entry);
    }
  }
  return [...byName.values()];
}
