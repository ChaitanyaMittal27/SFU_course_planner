package com.example.courseplanner.dto;

/**
 * DTO for enrollment time-series data points
 * Used in /api/graph/enrollment-history endpoint
 * 
 * Represents enrollment data for a single semester
 * Used for both:
 * - Chart A: Load Over Time (loadPercent)
 * - Chart B: Enrollment vs Capacity (enrolled, capacity)
 */
public class ApiEnrollmentDataPointDTO {

    private Long semesterCode;     // 1257
    private String term;           // "fall"
    private Long year;             // 2025
    
    private Integer enrolled;      // Total enrolled students
    private Integer capacity;      // Total capacity
    private Double loadPercent;    // enrolled/capacity * 100

    // Constructor
    public ApiEnrollmentDataPointDTO(
        Long semesterCode,
        String term,
        Long year,
        Integer enrolled,
        Integer capacity,
        Double loadPercent
    ) {
        this.semesterCode = semesterCode;
        this.term = term;
        this.year = year;
        this.enrolled = enrolled;
        this.capacity = capacity;
        this.loadPercent = loadPercent;
    }

    // Getters and Setters
    public Long getSemesterCode() {
        return semesterCode;
    }

    public void setSemesterCode(Long semesterCode) {
        this.semesterCode = semesterCode;
    }

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public Long getYear() {
        return year;
    }

    public void setYear(Long year) {
        this.year = year;
    }

    public Integer getEnrolled() {
        return enrolled;
    }

    public void setEnrolled(Integer enrolled) {
        this.enrolled = enrolled;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Double getLoadPercent() {
        return loadPercent;
    }

    public void setLoadPercent(Double loadPercent) {
        this.loadPercent = loadPercent;
    }
}