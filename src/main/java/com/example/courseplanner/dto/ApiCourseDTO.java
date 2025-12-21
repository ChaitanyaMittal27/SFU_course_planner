/**
 * Data Transfer Object (DTO) representing a course.
 * Includes course-specific details such as its ID and catalog number.
 * Typically used when listing or interacting with courses.
 */


package com.example.courseplanner.dto;

public class ApiCourseDTO {

    private Long courseId;
    private Long deptId;
    private String courseNumber;
    private String title;
    private String description;
    private Long units;
    private String degreeLevel;
    private String prerequisites;
    private String corequisites;
    private String designation;

    public ApiCourseDTO() {}

    public ApiCourseDTO(
            Long courseId,
            Long deptId,
            String courseNumber,
            String title,
            String description,
            Long units,
            String degreeLevel,
            String prerequisites,
            String corequisites,
            String designation
    ) {
        this.courseId = courseId;
        this.deptId = deptId;
        this.courseNumber = courseNumber;
        this.title = title;
        this.description = description;
        this.units = units;
        this.degreeLevel = degreeLevel;
        this.prerequisites = prerequisites;
        this.corequisites = corequisites;
        this.designation = designation;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getDeptId() {
        return deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getUnits() {
        return units;
    }

    public void setUnits(Long units) {
        this.units = units;
    }

    public String getDegreeLevel() {
        return degreeLevel;
    }

    public void setDegreeLevel(String degreeLevel) {
        this.degreeLevel = degreeLevel;
    }

    public String getPrerequisites() {
        return prerequisites;
    }

    public void setPrerequisites(String prerequisites) {
        this.prerequisites = prerequisites;
    }

    public String getCorequisites() {
        return corequisites;
    }

    public void setCorequisites(String corequisites) {
        this.corequisites = corequisites;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }
}

