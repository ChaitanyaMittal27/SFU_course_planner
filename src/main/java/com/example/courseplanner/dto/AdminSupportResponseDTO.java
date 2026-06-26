package com.example.courseplanner.dto;

import java.util.List;

public class AdminSupportResponseDTO {

    private AdminSupportStatsDTO stats;
    private List<AdminContactSubmissionDTO> submissions;

    public AdminSupportResponseDTO(AdminSupportStatsDTO stats, List<AdminContactSubmissionDTO> submissions) {
        this.stats = stats;
        this.submissions = submissions;
    }

    public AdminSupportStatsDTO getStats() { return stats; }
    public void setStats(AdminSupportStatsDTO stats) { this.stats = stats; }

    public List<AdminContactSubmissionDTO> getSubmissions() { return submissions; }
    public void setSubmissions(List<AdminContactSubmissionDTO> submissions) { this.submissions = submissions; }
}
