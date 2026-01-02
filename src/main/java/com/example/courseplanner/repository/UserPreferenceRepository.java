package com.example.courseplanner.repository;

import com.example.courseplanner.entity.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
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
 * - findById(UUID id) - Inherited from JpaRepository
 * - save(UserPreference) - Inherited from JpaRepository
 * =========================================================
 */
@Repository
public interface UserPreferenceRepository extends JpaRepository<UserPreference, UUID> {
    // JpaRepository provides:
    // - Optional<UserPreference> findById(UUID id)
    // - UserPreference save(UserPreference entity)
    // - void delete(UserPreference entity)
    // - boolean existsById(UUID id)
}