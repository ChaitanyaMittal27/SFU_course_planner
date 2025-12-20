// src/main/java/com/example/courseplanner/entity/Course.java
package com.example.courseplanner.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "courses", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"dept_id", "catalog_number"})
})
public class Course {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Long courseId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id", nullable = false)
    private Department department;
    
    @Column(name = "catalog_number", nullable = false, length = 10)
    private String catalogNumber;
    
    @OneToMany(mappedBy = "course", fetch = FetchType.LAZY)
    private List<CourseOffering> offerings;
    
    // Constructors
    public Course() {}
    
    public Course(Department department, String catalogNumber) {
        this.department = department;
        this.catalogNumber = catalogNumber;
    }
    
    // Getters and Setters
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    
    public String getCatalogNumber() { return catalogNumber; }
    public void setCatalogNumber(String catalogNumber) { this.catalogNumber = catalogNumber; }
    
    public List<CourseOffering> getOfferings() { return offerings; }
    public void setOfferings(List<CourseOffering> offerings) { this.offerings = offerings; }
}