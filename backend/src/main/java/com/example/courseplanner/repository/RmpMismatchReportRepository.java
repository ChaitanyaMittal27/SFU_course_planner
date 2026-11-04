package com.example.courseplanner.repository;

import com.example.courseplanner.entity.RmpMismatchReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Repository
public interface RmpMismatchReportRepository extends JpaRepository<RmpMismatchReport, Long> {

    /** Open reports summed up per lookup. */
    interface OpenReportSummary {
        Long getLookupId();
        Long getOpenReports();
        Instant getFirstReportedAt();
        Instant getLastReportedAt();
    }

    /** One row per lookup that has open reports: most reported first, then most recently reported. */
    @Query("""
        SELECT r.lookupId AS lookupId,
               COUNT(r) AS openReports,
               MIN(r.createdAt) AS firstReportedAt,
               MAX(r.createdAt) AS lastReportedAt
        FROM RmpMismatchReport r
        WHERE r.resolvedAt IS NULL
        GROUP BY r.lookupId
        ORDER BY COUNT(r) DESC, MAX(r.createdAt) DESC
        """)
    List<OpenReportSummary> findOpenReportSummaries();

    /** Marks every open report for the lookup as resolved. Returns how many were resolved. */
    @Modifying
    @Transactional
    @Query("UPDATE RmpMismatchReport r SET r.resolvedAt = :resolvedAt "
        + "WHERE r.lookupId = :lookupId AND r.resolvedAt IS NULL")
    int resolveOpenReports(@Param("lookupId") Long lookupId, @Param("resolvedAt") Instant resolvedAt);
}
