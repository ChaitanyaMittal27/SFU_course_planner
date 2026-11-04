package com.example.courseplanner.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A user's report that an {@link RmpLookup} shows the wrong professor. Anyone can report;
 * admins review open reports ({@code resolvedAt == null}) on the admin RMP Reports page.
 * Deleted automatically with their lookup.
 */
@Entity
@Table(name = "rmp_mismatch_reports")
public class RmpMismatchReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportId;

    @Column(name = "lookup_id", nullable = false)
    private Long lookupId;

    /** The RMP ID the lookup pointed to when reported (null for a no-match). */
    @Column(name = "rmp_teacher_id", length = 64)
    private String rmpTeacherId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** When an admin resolved the report; null while open. */
    @Column(name = "resolved_at")
    private Instant resolvedAt;

    // ----------------------------
    // Constructors
    // ----------------------------
    public RmpMismatchReport() {}

    public RmpMismatchReport(Long lookupId, String rmpTeacherId, Instant createdAt) {
        this.lookupId = lookupId;
        this.rmpTeacherId = rmpTeacherId;
        this.createdAt = createdAt;
    }

    // ----------------------------
    // Getters and Setters
    // ----------------------------
    public Long getReportId() { return reportId; }
    public void setReportId(Long reportId) { this.reportId = reportId; }

    public Long getLookupId() { return lookupId; }
    public void setLookupId(Long lookupId) { this.lookupId = lookupId; }

    public String getRmpTeacherId() { return rmpTeacherId; }
    public void setRmpTeacherId(String rmpTeacherId) { this.rmpTeacherId = rmpTeacherId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
