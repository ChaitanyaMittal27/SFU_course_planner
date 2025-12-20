// src/main/java/com/example/courseplanner/entity/CourseOffering.java
package com.example.courseplanner.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "course_offerings")
public class CourseOffering {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "offering_id")
    private Long offeringId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Column(name = "semester_code", nullable = false)
    private Integer semesterCode;
    
    @Column(length = 50)
    private String location;
    
    @Column(columnDefinition = "TEXT")
    private String instructors;
    
    @Column(name = "section_type", length = 10)
    private String sectionType;
    
    @Column(name = "enrollment_total")
    private Integer enrollmentTotal = 0;
    
    @Column(name = "enrollment_cap")
    private Integer enrollmentCap = 0;
    
    // Constructors
    public CourseOffering() {}
    
    // Getters and Setters
    public Long getOfferingId() { return offeringId; }
    public void setOfferingId(Long offeringId) { this.offeringId = offeringId; }
    
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    
    public Integer getSemesterCode() { return semesterCode; }
    public void setSemesterCode(Integer semesterCode) { this.semesterCode = semesterCode; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getInstructors() { return instructors; }
    public void setInstructors(String instructors) { this.instructors = instructors; }
    
    public String getSectionType() { return sectionType; }
    public void setSectionType(String sectionType) { this.sectionType = sectionType; }
    
    public Integer getEnrollmentTotal() { return enrollmentTotal; }
    public void setEnrollmentTotal(Integer enrollmentTotal) { this.enrollmentTotal = enrollmentTotal; }
    
    public Integer getEnrollmentCap() { return enrollmentCap; }
    public void setEnrollmentCap(Integer enrollmentCap) { this.enrollmentCap = enrollmentCap; }
}