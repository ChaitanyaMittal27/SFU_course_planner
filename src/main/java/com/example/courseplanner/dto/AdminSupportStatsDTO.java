package com.example.courseplanner.dto;

public class AdminSupportStatsDTO {

    private int totalSubmissions;
    private int unreadCount;
    private int archivedCount;

    public int getTotalSubmissions() { return totalSubmissions; }
    public void setTotalSubmissions(int totalSubmissions) { this.totalSubmissions = totalSubmissions; }

    public int getUnreadCount() { return unreadCount; }
    public void setUnreadCount(int unreadCount) { this.unreadCount = unreadCount; }

    public int getArchivedCount() { return archivedCount; }
    public void setArchivedCount(int archivedCount) { this.archivedCount = archivedCount; }
}
