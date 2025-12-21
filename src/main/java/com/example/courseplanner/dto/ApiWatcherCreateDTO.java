/**
 * Data Transfer Object (DTO) for creating a watcher.
 * Contains details such as the department ID and course ID to associate the watcher with.
 * Used in the `/api/add-watcher` endpoint.
 */


package com.example.courseplanner.dto;

public final class ApiWatcherCreateDTO {
    public long courseId;
    private long termId;

    // Constructor
    public ApiWatcherCreateDTO(long courseId, long termId) {
        this.courseId = courseId;
        this.termId = termId;
    }

    // Getters and Setters
    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public long getTermId() {
        return termId;
    }

    public void setTermId(long termId) {
        this.termId = termId;
    }
}
