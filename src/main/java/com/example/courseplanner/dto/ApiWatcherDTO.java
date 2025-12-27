package com.example.courseplanner.dto;

import java.time.LocalDateTime;

public class ApiWatcherDTO {

    private Long watcherId;
    private Long deptId;
    private Long courseId;
    private Long semesterCode;
    private String section;
    private LocalDateTime createdAt;

    // ----------------------------
    // Constructor
    // ----------------------------
    public ApiWatcherDTO(
        Long watcherId,
        Long deptId,
        Long courseId,
        Long semesterCode,
        String section,
        LocalDateTime createdAt
    ) {
        this.watcherId = watcherId;
        this.deptId = deptId;
        this.courseId = courseId;
        this.semesterCode = semesterCode;
        this.section = section;
        this.createdAt = createdAt;
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

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
