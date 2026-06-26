package com.example.courseplanner.dto;

public class AdminDeptRankingDTO {

    private String deptCode;
    private String departmentName;
    private int bookmarkCount;
    private double percentage;

    public AdminDeptRankingDTO(String deptCode, String departmentName, int bookmarkCount, double percentage) {
        this.deptCode = deptCode;
        this.departmentName = departmentName;
        this.bookmarkCount = bookmarkCount;
        this.percentage = percentage;
    }

    public String getDeptCode() { return deptCode; }
    public void setDeptCode(String deptCode) { this.deptCode = deptCode; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public int getBookmarkCount() { return bookmarkCount; }
    public void setBookmarkCount(int bookmarkCount) { this.bookmarkCount = bookmarkCount; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }
}
