package com.example.courseplanner.model.rmp;

/**
 * A teacher summary returned by RMP's school-scoped search query.
 * This is provider data, not a database entity or public API DTO.
 */
public record RmpTeacherSearchResult(
        String rmpTeacherId,
        Integer legacyId,
        String firstName,
        String lastName,
        String department,
        Double avgRating,
        Double avgDifficulty,
        Integer numRatings,
        Double wouldTakeAgainPercent,
        String rmpSchoolId,
        String schoolName
) {
}
