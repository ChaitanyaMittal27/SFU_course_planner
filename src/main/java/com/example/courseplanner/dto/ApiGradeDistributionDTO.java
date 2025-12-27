package com.example.courseplanner.dto;

import java.util.Map;

/**
 * DTO for grade distribution data from CourseDiggers
 * Used in /api/stats/grade-distribution endpoint
 * Returns course-level grade statistics (not semester-specific)
 */
public class ApiGradeDistributionDTO {

    private String deptCode;        // CMPT
    private String courseNumber;    // 276
    private String title;           // Introduction to Software Engineering

    private String medianGrade;     // A-
    private Double failRate;        // 2.52

    // Letter grade counts: {"A+": 68, "A": 218, "A-": 196, ...}
    private Map<String, Long> distribution;

    // Constructor
    public ApiGradeDistributionDTO(
        String deptCode,
        String courseNumber,
        String title,
        String medianGrade,
        Double failRate,
        Map<String, Long> distribution
    ) {
        this.deptCode = deptCode;
        this.courseNumber = courseNumber;
        this.title = title;
        this.medianGrade = medianGrade;
        this.failRate = failRate;
        this.distribution = distribution;
    }

    // Getters and Setters
    public String getDeptCode() {
        return deptCode;
    }

    public void setDeptCode(String deptCode) {
        this.deptCode = deptCode;
    }

    public String getCourseNumber() {
        return courseNumber;
    }

    public void setCourseNumber(String courseNumber) {
        this.courseNumber = courseNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMedianGrade() {
        return medianGrade;
    }

    public void setMedianGrade(String medianGrade) {
        this.medianGrade = medianGrade;
    }

    public Double getFailRate() {
        return failRate;
    }

    public void setFailRate(Double failRate) {
        this.failRate = failRate;
    }

    public Map<String, Long> getDistribution() {
        return distribution;
    }

    public void setDistribution(Map<String, Long> distribution) {
        this.distribution = distribution;
    }
}