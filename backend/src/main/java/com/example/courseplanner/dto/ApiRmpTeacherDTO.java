package com.example.courseplanner.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Live RMP ratings for a matched professor. Null numbers mean RMP has no data for that field. */
@Schema(description = "Matched RMP professor with live ratings")
public record ApiRmpTeacherDTO(
        String firstName,
        String lastName,
        @Schema(description = "Department as RMP lists it") String department,
        Double avgRating,
        Double avgDifficulty,
        Integer numRatings,
        Double wouldTakeAgainPercent,
        @Schema(example = "https://www.ratemyprofessors.com/professor/1436226") String profileUrl,
        @Schema(description = "0.8 × name similarity + 0.2 × department similarity, 0–1") Double matchScore
) {
}
