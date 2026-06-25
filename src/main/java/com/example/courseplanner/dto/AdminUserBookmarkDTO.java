package com.example.courseplanner.dto;

public class AdminUserBookmarkDTO {

    private Long bookmarkId;
    private String deptCode;
    private String courseNumber;
    private String title;
    private String section;
    private Long semesterCode;

    public AdminUserBookmarkDTO(Long bookmarkId, String deptCode, String courseNumber, String title, String section, Long semesterCode) {
        this.bookmarkId = bookmarkId;
        this.deptCode = deptCode;
        this.courseNumber = courseNumber;
        this.title = title;
        this.section = section;
        this.semesterCode = semesterCode;
    }

    public Long getBookmarkId() { return bookmarkId; }
    public void setBookmarkId(Long bookmarkId) { this.bookmarkId = bookmarkId; }

    public String getDeptCode() { return deptCode; }
    public void setDeptCode(String deptCode) { this.deptCode = deptCode; }

    public String getCourseNumber() { return courseNumber; }
    public void setCourseNumber(String courseNumber) { this.courseNumber = courseNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public Long getSemesterCode() { return semesterCode; }
    public void setSemesterCode(Long semesterCode) { this.semesterCode = semesterCode; }
}
