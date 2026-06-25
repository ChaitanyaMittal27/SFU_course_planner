package com.example.courseplanner.dto;

public class AdminTopCourseDTO {

    private String deptCode;
    private String courseNumber;
    private String title;
    private String departmentName;
    private int bookmarkCount;

    public AdminTopCourseDTO(String deptCode, String courseNumber, String title, String departmentName, int bookmarkCount) {
        this.deptCode = deptCode;
        this.courseNumber = courseNumber;
        this.title = title;
        this.departmentName = departmentName;
        this.bookmarkCount = bookmarkCount;
    }

    public String getDeptCode() { return deptCode; }
    public void setDeptCode(String deptCode) { this.deptCode = deptCode; }

    public String getCourseNumber() { return courseNumber; }
    public void setCourseNumber(String courseNumber) { this.courseNumber = courseNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public int getBookmarkCount() { return bookmarkCount; }
    public void setBookmarkCount(int bookmarkCount) { this.bookmarkCount = bookmarkCount; }
}
