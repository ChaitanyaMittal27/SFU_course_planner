package com.example.courseplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "watchers",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {
            "dept_id",
            "user_id",
            "course_id",
            "semester_code",
            "section"
        })
    },
    indexes = {
        @Index(
            name = "idx_watchers_user",
            columnList = "user_id, dept_id, course_id, semester_code, section"
        )
    }
)
public class Watcher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "watcher_id")
    private Long watcherId;

    @Column(name = "dept_id", nullable = false)
    private Long deptId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "semester_code", nullable = false)
    private Long semesterCode;

    @Column(name = "section", nullable = false, length = 10)
    private String section;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ----------------------------
    // Constructors
    // ----------------------------
    public Watcher() {}

    public Watcher(Long userId, Long deptId, Long courseId, Long semesterCode, String section) {
        this.userId = userId;
        this.deptId = deptId;
        this.courseId = courseId;
        this.semesterCode = semesterCode;
        this.section = section;
    }


    // ----------------------------
    // Lifecycle hooks
    // ----------------------------
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ----------------------------
    // Getters & Setters
    // ----------------------------
    public Long getWatcherId() {
        return watcherId;
    }
    
    public void setWatcherId(Long watcherId) {
        this.watcherId = watcherId;
    }

    public Long getDeptId() {
        return deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getSemesterCode() {
        return semesterCode;
    }

    public void setSemesterCode(Long semesterCode) {
        this.semesterCode = semesterCode;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
