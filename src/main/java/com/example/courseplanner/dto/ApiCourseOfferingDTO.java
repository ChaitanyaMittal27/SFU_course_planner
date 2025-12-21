/**
 * Data Transfer Object (DTO) representing a specific course offering.
 * Includes details such as location, instructors, term, semester code, and year.
 * Used in responses involving course offering data.
 */

package com.example.courseplanner.dto;

public class ApiCourseOfferingDTO {
    // Section identity
    private String section;        // D100
    private String infoUrl;        // /browse/info/2025fa-cmpt-276-d1

    // Term info
    private String term;           // Fall
    private Long year;              // 2025
    private Long semesterCode;     // 1257
    private boolean isEnrolling;   // true if from enrolling term

    // Display info
    private String location;       // Burnaby
    private String instructors;    // Saba Alimadadi

    // Enrollment data
    private String enrolled;          // 96
    private String capacity;          // 100
    private Long loadPercent;       // 96

    // constructors
    public ApiCourseOfferingDTO(String section, String infoUrl, String term, Long year, Long semesterCode, boolean isEnrolling, String location, String instructors, String enrolled, String capacity, Long loadPercent) {
        this.section = section;
        this.infoUrl = infoUrl;

        this.term = term;
        this.semesterCode = semesterCode;
        this.year = year;
        this.isEnrolling = isEnrolling;

        this.location = location;
        this.instructors = instructors;

        this.enrolled = enrolled;
        this.capacity = capacity;
        this.loadPercent = loadPercent;        
    }

    // getters and setters
    public String getSection() {
        return section;
    }
    public void setSection(String section) {
        this.section = section;
    }
    public String getInfoUrl() {
        return infoUrl;
    }
    public void setInfoUrl(String infoUrl) {
        this.infoUrl = infoUrl;
    }
    public String getInstructors() {
        return instructors;
    }
    public void setInstructors(String instructors) {
        this.instructors = instructors;
    }
    public String getTerm() {
        return term;
    }
    public void setTerm(String term) {
        this.term = term;
    }
    public Long getSemesterCode() {
        return semesterCode;
    }
    public void setSemesterCode(Long semesterCode) {
        this.semesterCode = semesterCode;
    }
    public boolean isEnrolling() {
        return isEnrolling;
    }
    public void setEnrolling(boolean isEnrolling) {
        this.isEnrolling = isEnrolling;
    }
    public Long getYear() {
        return year;
    }
    public void setYear(Long year) {
        this.year = year;
    }
    public String getLocation() {
        return location;
    }
    public void setLocation(String location) {
        this.location = location;
    }
    public String getEnrolled() {
        return enrolled;
    }
    public void setEnrolled(String enrolled) {
        this.enrolled = enrolled;
    }
    public String getCapacity() {
        return capacity;
    }
    public void setCapacity(String capacity) {
        this.capacity = capacity;
    }
    public Long getLoadPercent() {
        return loadPercent;
    }
    public void setLoadPercent(Long loadPercent) {
        this.loadPercent = loadPercent;
    }
}