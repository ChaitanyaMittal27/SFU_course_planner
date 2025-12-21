package com.example.courseplanner.dto;

import java.util.List;
import java.util.Map;

public class ApiOfferingDetailDTO {

    // --- Header ---
    private String deptCode;        // CMPT
    private String courseNumber;    // 276
    private String title;           // Intro Software Engineering

    private long year;               // 2025
    private String term;            // fall
    private String campus;          // Burnaby (dominant / first)

    // --- Course stats (CourseDiggers) ---
    private String medianGrade;     // A-
    private double failRate;        // 2.52
    private Map<String, Long> gradeDistribution;

    // --- Course info (DB) ---
    private String description;
    private String prerequisites;
    private String corequisites;
    private long units;
    private String degreeLevel;
    private String designation;

    // --- Sections (CourseSys) ---
    private List<ApiCourseOfferingDTO> sections;

    // --- External link ---
    private String outlineUrl;

    // constructor
    public ApiOfferingDetailDTO(String deptCode, String courseNumber, String title, long year, String term, String campus, String medianGrade, double failRate, Map<String, Long> gradeDistribution, String description, String prerequisites, String corequisites, long units, String degreeLevel, String designation, List<ApiCourseOfferingDTO> sections, String outlineUrl) {
        this.deptCode = deptCode;
        this.courseNumber = courseNumber;
        this.title = title;
        this.year = year;
        this.term = term;
        this.campus = campus;
        this.medianGrade = medianGrade;
        this.failRate = failRate;
        this.gradeDistribution = gradeDistribution;
        this.description = description;
        this.prerequisites = prerequisites;
        this.corequisites = corequisites;
        this.units = units;
        this.degreeLevel = degreeLevel;
        this.designation = designation;
        this.sections = sections;
        this.outlineUrl = outlineUrl;
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
    public long getYear() {
        return year;
    }
    public void setYear(long year) {
        this.year = year;
    }
    public String getTerm() {
        return term;
    }
    public void setTerm(String term) {
        this.term = term;
    }
    public String getCampus() {
        return campus;
    }
    public void setCampus(String campus) {
        this.campus = campus;
    }
    public String getMedianGrade() {
        return medianGrade;
    }
    public void setMedianGrade(String medianGrade) {
        this.medianGrade = medianGrade;
    }
    public double getFailRate() {
        return failRate;
    }
    public void setFailRate(double failRate) {
        this.failRate = failRate;
    }
    public Map<String, Long> getGradeDistribution() {
        return gradeDistribution;
    }
    public void setGradeDistribution(Map<String, Long> gradeDistribution) {
        this.gradeDistribution = gradeDistribution;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
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
    public long getUnits() {
        return units;
    }
    public void setUnits(long units) {
        this.units = units;
    }
    public String getDegreeLevel() {
        return degreeLevel;
    }
    public void setDegreeLevel(String degreeLevel) {
        this.degreeLevel = degreeLevel;
    }
    public String getDesignation() {
        return designation;
    }
    public void setDesignation(String designation) {
        this.designation = designation;
    }
    public List<ApiCourseOfferingDTO> getSections() {
        return sections;
    }
    public void setSections(List<ApiCourseOfferingDTO> sections) {
        this.sections = sections;
    }
    public String getOutlineUrl() {
        return outlineUrl;
    }
    public void setOutlineUrl(String outlineUrl) {
        this.outlineUrl = outlineUrl;
    }
}

