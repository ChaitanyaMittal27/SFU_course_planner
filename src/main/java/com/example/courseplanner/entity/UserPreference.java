package com.example.courseplanner.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * =========================================================
 * USER PREFERENCE ENTITY
 * 
 * Stores user-level preferences for email notifications.
 * 
 * Table: user_preferences
 * Primary Key: user_id (UUID)
 * =========================================================
 */
@Entity
@Table(name = "user_preferences")
public class UserPreference {

    @Id
    @Column(name = "user_id", columnDefinition = "UUID")
    private UUID userId;

    @Column(name = "email_notifications_enabled", nullable = false)
    private Boolean emailNotificationsEnabled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // =====================================================
    // CONSTRUCTORS
    // =====================================================

    public UserPreference() {
        // JPA requires default constructor
    }

    public UserPreference(UUID userId, Boolean emailNotificationsEnabled) {
        this.userId = userId;
        this.emailNotificationsEnabled = emailNotificationsEnabled;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // =====================================================
    // LIFECYCLE CALLBACKS
    // =====================================================

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Boolean getEmailNotificationsEnabled() {
        return emailNotificationsEnabled;
    }

    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) {
        this.emailNotificationsEnabled = emailNotificationsEnabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}