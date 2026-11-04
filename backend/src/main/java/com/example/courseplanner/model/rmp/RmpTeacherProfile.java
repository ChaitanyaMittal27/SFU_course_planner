package com.example.courseplanner.model.rmp;

/**
 * The current RMP summary for one teacher, fetched by opaque GraphQL ID.
 */
public record RmpTeacherProfile(
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
        String schoolName,
        String schoolCity,
        String schoolState
) {
}
