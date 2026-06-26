package com.example.courseplanner.dto;

public class AdminUserStatsDTO {

    private int totalUsers;
    private int newThisMonth;
    private int optedInNotifications;
    private int activeInLast30Days;
    private int providerGoogle;
    private int providerEmail;

    public int getTotalUsers() { return totalUsers; }
    public void setTotalUsers(int totalUsers) { this.totalUsers = totalUsers; }

    public int getNewThisMonth() { return newThisMonth; }
    public void setNewThisMonth(int newThisMonth) { this.newThisMonth = newThisMonth; }

    public int getOptedInNotifications() { return optedInNotifications; }
    public void setOptedInNotifications(int optedInNotifications) { this.optedInNotifications = optedInNotifications; }

    public int getActiveInLast30Days() { return activeInLast30Days; }
    public void setActiveInLast30Days(int activeInLast30Days) { this.activeInLast30Days = activeInLast30Days; }

    public int getProviderGoogle() { return providerGoogle; }
    public void setProviderGoogle(int providerGoogle) { this.providerGoogle = providerGoogle; }

    public int getProviderEmail() { return providerEmail; }
    public void setProviderEmail(int providerEmail) { this.providerEmail = providerEmail; }
}
