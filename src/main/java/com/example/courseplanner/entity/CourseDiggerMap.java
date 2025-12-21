// src/main/java/com/example/courseplanner/entity/CourseDiggerMap.java
package com.example.courseplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_digger_map")
public class CourseDiggerMap {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_digger_map_id")
    private Long mapId;
    
    @OneToOne
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    private Course course;
    
    @Column(name = "digger_course_id", nullable = false, unique = true)
    private Integer diggerCourseId;
    
    @Column(name = "source_school_id", nullable = false)
    private Integer sourceSchoolId = 1; // 1 = SFU
    
    @Column(name = "discovered_at", updatable = false)
    private LocalDateTime discoveredAt;
    
    @Column(name = "last_verified_at")
    private LocalDateTime lastVerifiedAt;
    
    // Relationship to stats
    @OneToOne(mappedBy = "diggerMap", fetch = FetchType.LAZY)
    private CourseDiggerStats stats;
    
    // Constructors
    public CourseDiggerMap() {}
    
    public CourseDiggerMap(Course course, Integer diggerCourseId) {
        this.course = course;
        this.diggerCourseId = diggerCourseId;
    }
    
    @PrePersist
    protected void onCreate() {
        discoveredAt = LocalDateTime.now();
        lastVerifiedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getMapId() { return mapId; }
    public void setMapId(Long mapId) { this.mapId = mapId; }
    
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    
    public Integer getDiggerCourseId() { return diggerCourseId; }
    public void setDiggerCourseId(Integer diggerCourseId) { this.diggerCourseId = diggerCourseId; }
    
    public Integer getSourceSchoolId() { return sourceSchoolId; }
    public void setSourceSchoolId(Integer sourceSchoolId) { this.sourceSchoolId = sourceSchoolId; }
    
    public LocalDateTime getDiscoveredAt() { return discoveredAt; }
    public LocalDateTime getLastVerifiedAt() { return lastVerifiedAt; }
    
    public CourseDiggerStats getStats() { return stats; }
    public void setStats(CourseDiggerStats stats) { this.stats = stats; }
}