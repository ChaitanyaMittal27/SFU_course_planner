// src/main/java/com/example/courseplanner/entity/Course.java
package com.example.courseplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "courses", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"dept_id", "course_number"})
})
public class Course {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Long courseId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id", nullable = false)
    private Department department;
    
    @Column(name = "course_number", nullable = false, length = 10)
    private String courseNumber;
    
    @Column(length = 500)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private Long units;
    
    @Column(name = "degree_level", length = 20)
    private String degreeLevel;
    
    @Column(columnDefinition = "TEXT")
    private String prerequisites;
    
    @Column(columnDefinition = "TEXT")
    private String corequisites;
    
    @Column(length = 100)
    private String designation;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // RELATIONSHIP: Course has one stats record
    @OneToOne(mappedBy = "course", fetch = FetchType.LAZY)
    private CourseStats stats;
    
    // RELATIONSHIP: Course has one digger map entry
    @OneToOne(mappedBy = "course", fetch = FetchType.LAZY)
    private CourseDiggerMap diggerMap;
    
    // Constructors
    public Course() {}
    
    public Course(Department department, String courseNumber) {
        this.department = department;
        this.courseNumber = courseNumber;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    
    public String getCourseNumber() { return courseNumber; }
    public void setCourseNumber(String courseNumber) { this.courseNumber = courseNumber; }
  
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Long getUnits() { return units; }
    public void setUnits(Long units) { this.units = units; }
    
    public String getDegreeLevel() { return degreeLevel; }
    public void setDegreeLevel(String degreeLevel) { this.degreeLevel = degreeLevel; }
    
    public String getPrerequisites() { return prerequisites; }
    public void setPrerequisites(String prerequisites) { this.prerequisites = prerequisites; }
    
    public String getCorequisites() { return corequisites; }
    public void setCorequisites(String corequisites) { this.corequisites = corequisites; }
    
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    
    public CourseStats getStats() { return stats; }
    public void setStats(CourseStats stats) { this.stats = stats; }
    
    public CourseDiggerMap getDiggerMap() { return diggerMap; }
    public void setDiggerMap(CourseDiggerMap diggerMap) { this.diggerMap = diggerMap; }
}