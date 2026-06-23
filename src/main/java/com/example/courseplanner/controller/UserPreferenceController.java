package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiUserPreferenceDTO;
import com.example.courseplanner.entity.UserPreference;
import com.example.courseplanner.repository.UserPreferenceRepository;
import com.example.courseplanner.service.JwtService;

import org.springframework.http.HttpStatus;
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
 * - POST   /api/preferences                      → Initialize on signup
 * - GET    /api/preferences/email-notifications  → Get preference
 * - PUT    /api/preferences/email-notifications  → Update preference
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
    // POST /api/preferences
    //
    // Initializes preferences row on first signup.
    // If row already exists, returns existing (no overwrite).
    //
    // Headers: Authorization: Bearer <JWT>
    // Body: { "userEmail": "user@example.com" }
    // Returns: 201 Created (new) or 200 OK (already exists)
    // =====================================================
    @PostMapping
    public ResponseEntity<ApiUserPreferenceDTO> initializePreferences(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody ApiUserPreferenceDTO dto
    ) {
        UUID userId = UUID.fromString(jwtService.extractUserId(authHeader));

        // If already exists return existing (don't overwrite)
        if (userPreferenceRepository.existsById(userId)) {
            UserPreference existing = userPreferenceRepository.findById(userId).get();
            ApiUserPreferenceDTO response = toDTO(existing);
            return ResponseEntity.ok(response);
        }

        // Create new row with email, notifications off by default
        UserPreference preference = new UserPreference(userId, false);
        if (dto.getUserEmail() != null) {
            preference.setUserEmail(dto.getUserEmail());
        }

        userPreferenceRepository.save(preference);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(toDTO(preference));
    }

    // =====================================================
    // GET /api/preferences/email-notifications
    //
    // Returns email notification preference for user.
    // Defaults to false + null email if no row exists yet.
    //
    // Headers: Authorization: Bearer <JWT>
    // Returns: { "emailNotificationsEnabled": false,
    //            "userEmail": "user@example.com" }
    // =====================================================
    @GetMapping("/email-notifications")
    public ResponseEntity<ApiUserPreferenceDTO> getEmailNotificationPreference(
        @RequestHeader("Authorization") String authHeader
    ) {
        UUID userId = UUID.fromString(jwtService.extractUserId(authHeader));

        // Return preference or default (false, null email)
        UserPreference preference = userPreferenceRepository.findById(userId)
            .orElse(new UserPreference(userId, false));

        return ResponseEntity.ok(toDTO(preference));
    }

    // =====================================================
    // PUT /api/preferences/email-notifications
    //
    // Updates email notification preference for user.
    // Creates row if it doesn't exist (upsert).
    // Only updates userEmail if provided in payload.
    //
    // Headers: Authorization: Bearer <JWT>
    // Body: { "emailNotificationsEnabled": true,
    //         "userEmail": "user@example.com" }
    // Returns: { "emailNotificationsEnabled": true,
    //            "userEmail": "user@example.com" }
    // =====================================================
    @PutMapping("/email-notifications")
    public ResponseEntity<ApiUserPreferenceDTO> updateEmailNotificationPreference(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody ApiUserPreferenceDTO dto
    ) {
        UUID userId = UUID.fromString(jwtService.extractUserId(authHeader));

        // Get existing or create new
        UserPreference preference = userPreferenceRepository.findById(userId)
            .orElse(new UserPreference(userId, false));

        // Update notification toggle
        preference.setEmailNotificationsEnabled(dto.getEmailNotificationsEnabled());

        // Only update email if provided
        if (dto.getUserEmail() != null) {
            preference.setUserEmail(dto.getUserEmail());
        }

        preference.setUpdatedAt(Instant.now());
        userPreferenceRepository.save(preference);

        return ResponseEntity.ok(toDTO(preference));
    }

    // =====================================================
    // INTERNAL MAPPER
    //
    // Entity → DTO
    // =====================================================
    private ApiUserPreferenceDTO toDTO(UserPreference p) {
        ApiUserPreferenceDTO dto = new ApiUserPreferenceDTO(
            p.getEmailNotificationsEnabled()
        );
        dto.setUserEmail(p.getUserEmail());
        return dto;
    }
}