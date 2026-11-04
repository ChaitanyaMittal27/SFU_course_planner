package com.example.courseplanner.model.rmp;

/**
 * A school returned by Rate My Professors' school-search query.
 * The opaque GraphQL ID is the identifier required by later RMP requests.
 */
public record RmpSchoolSearchResult(
        String rmpSchoolId,
        Integer legacyId,
        String name,
        String city,
        String state
) {
}
