package com.example.courseplanner.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Result of an RMP lookup for one instructor in one department.
 *
 * MATCHED     - {@code teacher} holds live ratings and the profile link.
 * NO_MATCH    - RMP was searched and nobody scored high enough; use {@code searchUrl}.
 * UNAVAILABLE - RMP could not be reached; nothing was stored. Retry later or use {@code searchUrl}.
 */
@Schema(description = "RMP lookup result for one CourseSys instructor in one department")
public record ApiRmpDTO(
        @Schema(allowableValues = {"MATCHED", "NO_MATCH", "UNAVAILABLE"}) String status,
        @Schema(description = "Lookup row ID, used to report a wrong match. Null if nothing is stored yet.")
        Long lookupId,
        @Schema(example = "Margaret Hall") String searchName,
        @Schema(description = "RMP search page for this name at SFU") String searchUrl,
        @Schema(description = "Present only when status is MATCHED") ApiRmpTeacherDTO teacher
) {
    public static final String MATCHED = "MATCHED";
    public static final String NO_MATCH = "NO_MATCH";
    public static final String UNAVAILABLE = "UNAVAILABLE";
}
