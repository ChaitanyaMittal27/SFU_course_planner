package com.example.courseplanner.dto;

import java.util.List;

public class AdminUsersResponseDTO {

    private AdminUserStatsDTO stats;
    private List<AdminUserDTO> users;

    public AdminUsersResponseDTO(AdminUserStatsDTO stats, List<AdminUserDTO> users) {
        this.stats = stats;
        this.users = users;
    }

    public AdminUserStatsDTO getStats() { return stats; }
    public void setStats(AdminUserStatsDTO stats) { this.stats = stats; }

    public List<AdminUserDTO> getUsers() { return users; }
    public void setUsers(List<AdminUserDTO> users) { this.users = users; }
}
