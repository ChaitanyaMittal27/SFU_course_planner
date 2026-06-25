package com.example.courseplanner.dto;

public class AdminUserDTO {

    private String id;
    private String email;
    private String createdAt;
    private String lastSignInAt;
    private String provider;
    private String displayName;
    private Boolean emailVerified;
    private Boolean isAnonymous;
    private Boolean emailNotificationsEnabled;
    private String preferredEmail;
    private String lastNotifiedAt;
    private int bookmarkCount;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getLastSignInAt() { return lastSignInAt; }
    public void setLastSignInAt(String lastSignInAt) { this.lastSignInAt = lastSignInAt; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

    public Boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(Boolean isAnonymous) { this.isAnonymous = isAnonymous; }

    public Boolean getEmailNotificationsEnabled() { return emailNotificationsEnabled; }
    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) { this.emailNotificationsEnabled = emailNotificationsEnabled; }

    public String getPreferredEmail() { return preferredEmail; }
    public void setPreferredEmail(String preferredEmail) { this.preferredEmail = preferredEmail; }

    public String getLastNotifiedAt() { return lastNotifiedAt; }
    public void setLastNotifiedAt(String lastNotifiedAt) { this.lastNotifiedAt = lastNotifiedAt; }

    public int getBookmarkCount() { return bookmarkCount; }
    public void setBookmarkCount(int bookmarkCount) { this.bookmarkCount = bookmarkCount; }
}
