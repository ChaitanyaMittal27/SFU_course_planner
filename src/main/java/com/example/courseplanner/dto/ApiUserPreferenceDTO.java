package com.example.courseplanner.dto;

/**
 * =========================================================
 * API USER PREFERENCE DTO
 * 
 * Simple DTO for transferring email notification preference.
 * 
 * Used by:
 * - GET /api/preferences/email-notifications
 * - PUT /api/preferences/email-notifications
 * 
 * JSON Format:
 * {
 *   "emailNotificationsEnabled": true
 * }
 * =========================================================
 */
public class ApiUserPreferenceDTO {

    private Boolean emailNotificationsEnabled;

    public ApiUserPreferenceDTO() {
        // Default constructor
    }

    public ApiUserPreferenceDTO(Boolean emailNotificationsEnabled) {
        this.emailNotificationsEnabled = emailNotificationsEnabled;
    }

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public Boolean getEmailNotificationsEnabled() {
        return emailNotificationsEnabled;
    }

    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) {
        this.emailNotificationsEnabled = emailNotificationsEnabled;
    }
}