package com.example.courseplanner.dto;

public class AdminBookmarkStatsDTO {

    private int totalBookmarks;
    private double avgPerUser;
    private String topDepartment;
    private String topDepartmentName;
    private int uniqueCourses;

    public int getTotalBookmarks() { return totalBookmarks; }
    public void setTotalBookmarks(int totalBookmarks) { this.totalBookmarks = totalBookmarks; }

    public double getAvgPerUser() { return avgPerUser; }
    public void setAvgPerUser(double avgPerUser) { this.avgPerUser = avgPerUser; }

    public String getTopDepartment() { return topDepartment; }
    public void setTopDepartment(String topDepartment) { this.topDepartment = topDepartment; }

    public String getTopDepartmentName() { return topDepartmentName; }
    public void setTopDepartmentName(String topDepartmentName) { this.topDepartmentName = topDepartmentName; }

    public int getUniqueCourses() { return uniqueCourses; }
    public void setUniqueCourses(int uniqueCourses) { this.uniqueCourses = uniqueCourses; }
}
