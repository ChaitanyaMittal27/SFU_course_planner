// src/main/java/com/example/courseplanner/entity/Department.java
package com.example.courseplanner.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "departments")
public class Department {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dept_id")
    private Long deptId;
    
    @Column(name = "dept_code", unique = true, nullable = false, length = 10)
    private String deptCode;
    
    @Column(nullable = false)
    private String name;
    
    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    // "One department has many courses"
    private List<Course> courses;
    
    // Constructors
    public Department() {}
    
    public Department(String deptCode, String name) {
        this.deptCode = deptCode;
        this.name = name;
    }
    
    // Getters and Setters
    public Long getDeptId() { return deptId; }
    public void setDeptId(Long deptId) { this.deptId = deptId; }
    
    public String getDeptCode() { return deptCode; }
    public void setDeptCode(String deptCode) { this.deptCode = deptCode; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public List<Course> getCourses() { return courses; }
    public void setCourses(List<Course> courses) { this.courses = courses; }
}