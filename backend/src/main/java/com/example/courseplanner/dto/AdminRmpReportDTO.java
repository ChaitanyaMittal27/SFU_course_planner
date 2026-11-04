package com.example.courseplanner.dto;

/**
 * One lookup with open wrong-match reports, for the admin RMP Reports page.
 *
 * @param status          "MATCHED" or "NO_MATCH": what users currently see for this lookup
 * @param rmpLegacyId     RMP numeric ID of the current match; null for a no-match
 * @param profileUrl      ratemyprofessors.com link for the current match; null for a no-match
 * @param matchScore      matcher score of the current match; null for a no-match or a professor set by an admin
 * @param openReports     number of open reports
 * @param firstReportedAt ISO-8601 time of the oldest open report
 * @param lastReportedAt  ISO-8601 time of the newest open report
 */
public record AdminRmpReportDTO(
        Long lookupId,
        String rawName,
        String displayName,
        String deptCode,
        String status,
        Integer rmpLegacyId,
        String profileUrl,
        Double matchScore,
        long openReports,
        String firstReportedAt,
        String lastReportedAt
) {
}
