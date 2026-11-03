package com.example.courseplanner.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * An SFU listing on Rate My Professors. Instructor searches run once per active school.
 * Seeded by the RMP migration; tune {@code searchLimit} / {@code active} in the database.
 */
@Entity
@Table(name = "rmp_schools")
public class RmpSchool {

    @Id
    @Column(name = "rmp_school_id", length = 64)
    private String rmpSchoolId;

    @Column(name = "legacy_id", nullable = false, unique = true)
    private Integer legacyId;

    @Column(name = "name", nullable = false)
    private String name;

    /** Results taken from this school per search. */
    @Column(name = "search_limit", nullable = false)
    private Integer searchLimit;

    @Column(name = "active", nullable = false)
    private Boolean active;

    // ----------------------------
    // Constructors
    // ----------------------------
    public RmpSchool() {}

    public RmpSchool(String rmpSchoolId, Integer legacyId, String name, Integer searchLimit, Boolean active) {
        this.rmpSchoolId = rmpSchoolId;
        this.legacyId = legacyId;
        this.name = name;
        this.searchLimit = searchLimit;
        this.active = active;
    }

    // ----------------------------
    // Getters and Setters
    // ----------------------------
    public String getRmpSchoolId() { return rmpSchoolId; }
    public void setRmpSchoolId(String rmpSchoolId) { this.rmpSchoolId = rmpSchoolId; }

    public Integer getLegacyId() { return legacyId; }
    public void setLegacyId(Integer legacyId) { this.legacyId = legacyId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getSearchLimit() { return searchLimit; }
    public void setSearchLimit(Integer searchLimit) { this.searchLimit = searchLimit; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
