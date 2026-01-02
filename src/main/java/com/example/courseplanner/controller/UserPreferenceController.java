package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiUserPreferenceDTO;
import com.example.courseplanner.entity.UserPreference;
import com.example.courseplanner.repository.UserPreferenceRepository;
import com.example.courseplanner.service.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * =========================================================
 * USER PREFERENCE CONTROLLER (JWT Protected)
 * 
 * Manages user preferences for email notifications.
 * 
 * Security:
 * - All endpoints require valid JWT in Authorization header
 * - UserId extracted from JWT (not from URL)
 * - Users can only access their own preferences
 * 
 * Endpoints:
 * - GET    /api/preferences/email-notifications
 * - PUT    /api/preferences/email-notifications
 * =========================================================
 */
@RestController
@RequestMapping("/api/preferences")
public class UserPreferenceController {

    private final UserPreferenceRepository userPreferenceRepository;
    private final JwtService jwtService;

    public UserPreferenceController(
        UserPreferenceRepository userPreferenceRepository,
        JwtService jwtService
    ) {
        this.userPreferenceRepository = userPreferenceRepository;
        this.jwtService = jwtService;
    }

    // =====================================================
    // GET /api/preferences/email-notifications
    // 
    // Returns email notification preference for user.
    // Defaults to false if no preference exists yet.
    // 
    // Headers: Authorization: Bearer <JWT>
    // Returns: { "emailNotificationsEnabled": false }
    // =====================================================
    @GetMapping("/email-notifications")
    public ResponseEntity<ApiUserPreferenceDTO> getEmailNotificationPreference(
        @RequestHeader("Authorization") String authHeader
    ) {
        // Extract userId from JWT
        UUID userId = UUID.fromString(jwtService.extractUserId(authHeader));

        // Get preference or return default (false)
        UserPreference preference = userPreferenceRepository.findById(userId)
            .orElse(new UserPreference(userId, false));

        // Convert to DTO
        ApiUserPreferenceDTO dto = new ApiUserPreferenceDTO(
            preference.getEmailNotificationsEnabled()
        );

        return ResponseEntity.ok(dto);
    }

    // =====================================================
    // PUT /api/preferences/email-notifications
    // 
    // Updates email notification preference for user.
    // Creates preference if it doesn't exist (upsert).
    // 
    // Headers: Authorization: Bearer <JWT>
    // Body: { "emailNotificationsEnabled": true }
    // Returns: { "emailNotificationsEnabled": true }
    // =====================================================
    @PutMapping("/email-notifications")
    public ResponseEntity<ApiUserPreferenceDTO> updateEmailNotificationPreference(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody ApiUserPreferenceDTO dto
    ) {
        // Extract userId from JWT
        UUID userId = UUID.fromString(jwtService.extractUserId(authHeader));

        // Get existing preference or create new one
        UserPreference preference = userPreferenceRepository.findById(userId)
            .orElse(new UserPreference(userId, dto.getEmailNotificationsEnabled()));

        // Update preference
        preference.setEmailNotificationsEnabled(dto.getEmailNotificationsEnabled());
        preference.setUpdatedAt(Instant.now());

        // Save to database (upsert)
        userPreferenceRepository.save(preference);

        // Return updated preference
        ApiUserPreferenceDTO responseDto = new ApiUserPreferenceDTO(
            preference.getEmailNotificationsEnabled()
        );

        return ResponseEntity.ok(responseDto);
    }
}