// src/main/java/com/example/courseplanner/entity/CourseStats.java
package com.example.courseplanner.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;


@Entity
@Table(name = "course_stats")
public class CourseStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stats_id")
    private Long statsId;
    
    @OneToOne
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    private Course course;
    
    @Column(name = "total_enrollment")
    private Integer totalEnrollment = 0;
    
    @Column(name = "total_capacity")
    private Integer totalCapacity = 0;
    
    @Column(name = "load_percent")
    private Double loadPercent;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "offered_terms", columnDefinition = "jsonb")
    private Map<String, Object> offeredTerms; // e.g., { "2023": ["fall", "spring"], ... }
    
    @Column(name = "last_calculated_at")
    private LocalDateTime lastCalculatedAt;
    
    // Constructors
    public CourseStats() {}
    
    public CourseStats(Course course) {
        this.course = course;
    }
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastCalculatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getStatsId() { return statsId; }
    public void setStatsId(Long statsId) { this.statsId = statsId; }
    
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    
    public Integer getTotalEnrollment() { return totalEnrollment; }
    public void setTotalEnrollment(Integer totalEnrollment) { this.totalEnrollment = totalEnrollment; }
    
    public Integer getTotalCapacity() { return totalCapacity; }
    public void setTotalCapacity(Integer totalCapacity) { this.totalCapacity = totalCapacity; }
    
    public Double getLoadPercent() { return loadPercent; }
    public void setLoadPercent(Double loadPercent) { this.loadPercent = loadPercent; }
    
    public Map<String, Object> getOfferedTerms() { return offeredTerms; }
    public void setOfferedTerms(Map<String, Object> offeredTerms) { this.offeredTerms = offeredTerms; }
    
    public LocalDateTime getLastCalculatedAt() { return lastCalculatedAt; }
}