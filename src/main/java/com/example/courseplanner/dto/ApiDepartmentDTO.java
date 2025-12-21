/**
 * Data Transfer Object (DTO) representing a department.
 * Includes details such as the department's unique identifier and name.
 * Used in responses involving department-related data.
 */


package com.example.courseplanner.dto;

public class ApiDepartmentDTO {

    private long deptId;
    private String deptCode;
    private String name;

    public ApiDepartmentDTO() {}

    public ApiDepartmentDTO(long deptId, String deptCode, String name) {
        this.deptId = deptId;
        this.deptCode = deptCode;
        this.name = name;
    }

    public long getDeptId() {
        return deptId;
    }

    public void setDeptId(long deptId) {
        this.deptId = deptId;
    }

    public String getDeptCode() {
        return deptCode;
    }

    public void setDeptCode(String deptCode) {
        this.deptCode = deptCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

