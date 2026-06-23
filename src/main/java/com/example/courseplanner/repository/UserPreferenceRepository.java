package com.example.courseplanner.repository;

import com.example.courseplanner.entity.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * =========================================================
 * USER PREFERENCE REPOSITORY
 *
 * Data access layer for user preferences.
 *
 * IMPORTANT: Uses UUID as primary key type
 * Extends JpaRepository<UserPreference, UUID>
 *
 * Methods:
 * - findById(UUID id)                    — inherited
 * - save(UserPreference)                 — inherited
 * - existsById(UUID id)                  — inherited
 * - findAllWithNotificationsEnabled()    — custom (for scheduler)
 * =========================================================
 */
@Repository
public interface UserPreferenceRepository extends JpaRepository<UserPreference, UUID> {

    /**
     * Returns all users who have email notifications enabled
     * and have a valid email address stored.
     * Used by the daily email notification scheduler.
     */
    @Query(value = "SELECT * FROM user_preferences " +
                   "WHERE email_notifications_enabled = true " +
                   "AND user_email IS NOT NULL",
           nativeQuery = true)
    List<UserPreference> findAllWithNotificationsEnabled();
}