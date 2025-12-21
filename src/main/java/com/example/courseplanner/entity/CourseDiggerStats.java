// src/main/java/com/example/courseplanner/entity/CourseDiggerStats.java
package com.example.courseplanner.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "course_digger_stats")
public class CourseDiggerStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_digger_stats_id")
    private Long statsId;
    
    @OneToOne
    @JoinColumn(name = "course_digger_map_id", nullable = false, unique = true)
    private CourseDiggerMap diggerMap;
    
    @Column(name = "median_grade", length = 10)
    private String medianGrade;
    
    @Column(name = "fail_rate")
    private Double failRate;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "grade_distribution", columnDefinition = "jsonb")
    private Map<String, Object> gradeDistribution; // e.g., { "A": 45, "B": 30, ... }
    
    @Column(name = "last_fetched_at")
    private LocalDateTime lastFetchedAt;
    
    // Constructors
    public CourseDiggerStats() {}
    
    public CourseDiggerStats(CourseDiggerMap diggerMap) {
        this.diggerMap = diggerMap;
    }
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastFetchedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getStatsId() { return statsId; }
    public void setStatsId(Long statsId) { this.statsId = statsId; }
    
    public CourseDiggerMap getDiggerMap() { return diggerMap; }
    public void setDiggerMap(CourseDiggerMap diggerMap) { this.diggerMap = diggerMap; }
    
    public String getMedianGrade() { return medianGrade; }
    public void setMedianGrade(String medianGrade) { this.medianGrade = medianGrade; }
    
    public Double getFailRate() { return failRate; }
    public void setFailRate(Double failRate) { this.failRate = failRate; }
    
    public Map<String, Object> getGradeDistribution() { return gradeDistribution; }
    public void setGradeDistribution(Map<String, Object> gradeDistribution) { 
        this.gradeDistribution = gradeDistribution; 
    }
    
    public LocalDateTime getLastFetchedAt() { return lastFetchedAt; }
}