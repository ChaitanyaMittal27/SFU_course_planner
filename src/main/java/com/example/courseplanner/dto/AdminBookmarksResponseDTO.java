package com.example.courseplanner.dto;

import java.util.List;

public class AdminBookmarksResponseDTO {

    private AdminBookmarkStatsDTO stats;
    private List<AdminTopCourseDTO> topCourses;
    private List<AdminDeptRankingDTO> departmentRankings;
    private List<AdminBookmarkMonthDTO> monthlyGrowth;

    public AdminBookmarksResponseDTO(
        AdminBookmarkStatsDTO stats,
        List<AdminTopCourseDTO> topCourses,
        List<AdminDeptRankingDTO> departmentRankings,
        List<AdminBookmarkMonthDTO> monthlyGrowth
    ) {
        this.stats = stats;
        this.topCourses = topCourses;
        this.departmentRankings = departmentRankings;
        this.monthlyGrowth = monthlyGrowth;
    }

    public AdminBookmarkStatsDTO getStats() { return stats; }
    public void setStats(AdminBookmarkStatsDTO stats) { this.stats = stats; }

    public List<AdminTopCourseDTO> getTopCourses() { return topCourses; }
    public void setTopCourses(List<AdminTopCourseDTO> topCourses) { this.topCourses = topCourses; }

    public List<AdminDeptRankingDTO> getDepartmentRankings() { return departmentRankings; }
    public void setDepartmentRankings(List<AdminDeptRankingDTO> departmentRankings) { this.departmentRankings = departmentRankings; }

    public List<AdminBookmarkMonthDTO> getMonthlyGrowth() { return monthlyGrowth; }
    public void setMonthlyGrowth(List<AdminBookmarkMonthDTO> monthlyGrowth) { this.monthlyGrowth = monthlyGrowth; }
}
