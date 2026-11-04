package com.example.courseplanner.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Which RMP professor a CourseSys instructor name maps to, within one department.
 * One row per (cleanedName, deptCode). Only the identification is stored; ratings are
 * fetched live from RMP using {@code rmpTeacherId}.
 *
 * {@code noMatch = true} means a completed search found nobody scoring >= 0.75
 * (both RMP IDs are then null). It is searched again after 7 days.
 */
@Entity
@Table(
    name = "rmp_lookup",
    uniqueConstraints = @UniqueConstraint(columnNames = {"cleaned_name", "dept_code"})
)
public class RmpLookup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lookup_id")
    private Long lookupId;

    /** Name as CourseSys sent it on first lookup, e.g. "Hall, Margaret". */
    @Column(name = "raw_name", nullable = false)
    private String rawName;

    /** Normalized key, e.g. "margaret hall". */
    @Column(name = "cleaned_name", nullable = false)
    private String cleanedName;

    @Column(name = "dept_code", nullable = false, length = 10)
    private String deptCode;

    /** RMP GraphQL ID, used for API requests. */
    @Column(name = "rmp_teacher_id", length = 64)
    private String rmpTeacherId;

    /** RMP numeric ID, used for ratemyprofessors.com/professor/{id} links. */
    @Column(name = "rmp_legacy_id")
    private Integer rmpLegacyId;

    /** 0.8 × name similarity + 0.2 × department similarity of the chosen candidate. */
    @Column(name = "match_score")
    private Double matchScore;

    @Column(name = "no_match", nullable = false)
    private Boolean noMatch = false;

    /** When the last successful search ran. */
    @Column(name = "checked_at", nullable = false)
    private Instant checkedAt;

    // ----------------------------
    // Constructors
    // ----------------------------
    public RmpLookup() {}

    public RmpLookup(String rawName, String cleanedName, String deptCode) {
        this.rawName = rawName;
        this.cleanedName = cleanedName;
        this.deptCode = deptCode;
    }

    // ----------------------------
    // State changes
    // ----------------------------
    public void markMatched(String rmpTeacherId, Integer rmpLegacyId, Double matchScore, Instant checkedAt) {
        this.rmpTeacherId = rmpTeacherId;
        this.rmpLegacyId = rmpLegacyId;
        this.matchScore = matchScore;
        this.noMatch = false;
        this.checkedAt = checkedAt;
    }

    public void markNoMatch(Instant checkedAt) {
        this.rmpTeacherId = null;
        this.rmpLegacyId = null;
        this.matchScore = null;
        this.noMatch = true;
        this.checkedAt = checkedAt;
    }

    // ----------------------------
    // Getters and Setters
    // ----------------------------
    public Long getLookupId() { return lookupId; }
    public void setLookupId(Long lookupId) { this.lookupId = lookupId; }

    public String getRawName() { return rawName; }
    public void setRawName(String rawName) { this.rawName = rawName; }

    public String getCleanedName() { return cleanedName; }
    public void setCleanedName(String cleanedName) { this.cleanedName = cleanedName; }

    public String getDeptCode() { return deptCode; }
    public void setDeptCode(String deptCode) { this.deptCode = deptCode; }

    public String getRmpTeacherId() { return rmpTeacherId; }
    public void setRmpTeacherId(String rmpTeacherId) { this.rmpTeacherId = rmpTeacherId; }

    public Integer getRmpLegacyId() { return rmpLegacyId; }
    public void setRmpLegacyId(Integer rmpLegacyId) { this.rmpLegacyId = rmpLegacyId; }

    public Double getMatchScore() { return matchScore; }
    public void setMatchScore(Double matchScore) { this.matchScore = matchScore; }

    public Boolean getNoMatch() { return noMatch; }
    public void setNoMatch(Boolean noMatch) { this.noMatch = noMatch; }

    public Instant getCheckedAt() { return checkedAt; }
    public void setCheckedAt(Instant checkedAt) { this.checkedAt = checkedAt; }
}
