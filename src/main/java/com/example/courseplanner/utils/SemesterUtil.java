package com.example.courseplanner.utils;

/**
 * Utility class for working with SFU semesters.
 *
 * SFU term rules:
 *  - Spring → code ends in 1
 *  - Summer → code ends in 4
 *  - Fall   → code ends in 7
 *
 * Semester progression (forward):
 *  Spring → Summer → Fall → Spring (next year)
 *
 * Semester regression (backward):
 *  Spring ← Fall ← Summer ← Spring (prev year)
 */
public final class SemesterUtil {

    private SemesterUtil() {
        // utility class, no instances
    }

    /**
     * Represents a previous semester result.
     */
    public static final class Prev {
        private final long year;
        private final String term;
        private final long semesterCode;

        public Prev(long year, String term, long semesterCode) {
            this.year = year;
            this.term = term;
            this.semesterCode = semesterCode;
        }

        public long year() {
            return year;
        }

        public String term() {
            return term;
        }

        public long semesterCode() {
            return semesterCode;
        }
    }

    /**
     * Compute the previous semester given a year and term.
     *
     * @param year  e.g. 2026
     * @param term  "spring", "summer", or "fall" (case-insensitive)
     * @return Prev semester info
     */
    public static Prev previous(long year, String term) {
        term = normalizeTerm(term);

        switch (term) {
            case "spring":
                // previous is Fall of previous year
                return new Prev(
                        year - 1,
                        "fall",
                        buildSemesterCode(year - 1, "fall")
                );

            case "fall":
                // previous is Summer of same year
                return new Prev(
                        year,
                        "summer",
                        buildSemesterCode(year, "summer")
                );

            case "summer":
                // previous is Spring of same year
                return new Prev(
                        year,
                        "spring",
                        buildSemesterCode(year, "spring")
                );

            default:
                throw new IllegalArgumentException("Invalid term: " + term);
        }
    }

    /**
     * Build SFU semester code.
     *
     * Example:
     *  year=2025, term=fall → 1257
     *
     * @param year  full year (e.g. 2025)
     * @param term  "spring", "summer", "fall"
     */
    public static long buildSemesterCode(long year, String term) {
        term = normalizeTerm(term);

        long yearPart = year - 1900;
        long termPart;

        switch (term) {
            case "spring":
                termPart = 1;
                break;
            case "summer":
                termPart = 4;
                break;
            case "fall":
                termPart = 7;
                break;
            default:
                throw new IllegalArgumentException("Invalid term: " + term);
        }

        return yearPart * 10 + termPart;
    }

    /**
     * Normalize term strings to lowercase canonical form.
     */
    public static String normalizeTerm(String term) {
        if (term == null) {
            throw new IllegalArgumentException("Term cannot be null");
        }

        term = term.trim().toLowerCase();

        switch (term) {
            case "spring":
            case "summer":
            case "fall":
                return term;
            default:
                throw new IllegalArgumentException("Invalid term: " + term);
        }
    }

    /**
     * Capitalize term for UI display.
     *
     * "spring" → "Spring"
     */
    public static String capitalize(String term) {
        term = normalizeTerm(term);
        return term.substring(0, 1).toUpperCase() + term.substring(1);
    }

    /**
     * Decode SFU semester code into year and term.
     * Example:
     *  semesterCode=1257 → year=2025, term="fall"
     * @param semesterCode  e.g. 1257
     * @return DecodedSemester record
     */
    public static DecodedSemester decodeSemesterCode(long semesterCode) {
        long year = semesterCode / 10;
        int termDigit = (int) (semesterCode % 10);

        String term = switch (termDigit) {
            case 1 -> "spring";
            case 4 -> "summer";
            case 7 -> "fall";
            default -> throw new IllegalArgumentException(
                    "Invalid semester code: " + semesterCode
            );
        };

        return new DecodedSemester(year, term);
    }
    public record DecodedSemester(long year, String term) { }
}
