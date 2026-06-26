package com.example.courseplanner.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import com.example.courseplanner.exception.ForbiddenException;

import java.util.Map;

/**
 * =========================================================
 * JWT Verification Service (Supabase API Call)
 * 
 * Verifies JWTs by calling Supabase's user endpoint.
 * 
 * How It Works:
 * 1. Receive JWT from Authorization header
 * 2. Forward JWT to Supabase: GET /auth/v1/user
 * 3. Supabase verifies the JWT and returns user data
 * 4. Extract userId from response
 * 
 * Advantages:
 * - No JWT library needed
 * - No algorithm complexity (HS256/RS256/etc)
 * - Supabase handles all verification logic
 * - Always correct (source of truth)
 * - Works with any Supabase JWT type
 * 
 * Trade-off:
 * - Adds ~50-100ms latency per request
 * - Requires Supabase to be available
 * 
 * For most applications, this trade-off is acceptable.
 * =========================================================
 */
@Service
public class JwtService {

    @Value("${supabase.project.url}")
    private String supabaseProjectUrl;

    @Value("${supabase.anon.key}")
    private String supabaseAnonKey;

    private final RestTemplate restTemplate;

    public JwtService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Extracts userId from Authorization header.
     * 
     * This is the main method controllers will call.
     * It verifies the JWT by calling Supabase API.
     * 
     * @param authHeader Authorization header value (e.g., "Bearer eyJhbGci...")
     * @return Verified userId from Supabase
     * @throws RuntimeException if token is invalid, expired, or missing
     */
    public String extractUserId(String authHeader) {
        // 1. Extract JWT from "Bearer {token}" header
        String token = extractTokenFromHeader(authHeader);
        
        // 2. Verify JWT with Supabase and get user data
        Map<String, Object> userData = verifyTokenWithSupabase(token);
        
        // 3. Extract userId from response
        return extractUserIdFromResponse(userData);
    }

    /**
     * Extracts JWT token from Authorization header.
     * 
     * @param authHeader Full Authorization header (e.g., "Bearer eyJhbGci...")
     * @return JWT token without "Bearer " prefix
     * @throws IllegalArgumentException if header is invalid
     */
    private String extractTokenFromHeader(String authHeader) {
        if (authHeader == null || authHeader.isEmpty()) {
            throw new IllegalArgumentException("Authorization header is missing");
        }
        
        if (!authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization header must start with 'Bearer '");
        }
        
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        
        if (token.isEmpty()) {
            throw new IllegalArgumentException("JWT token is empty");
        }
        
        return token;
    }

    /**
     * Verifies JWT by calling Supabase's user endpoint.
     * 
     * Makes HTTP request to:
     * GET https://yourproject.supabase.co/auth/v1/user
     * 
     * With headers:
     * Authorization: Bearer <JWT>
     * apikey: <anon-key>
     * 
     * Supabase Response (if valid):
     * {
     *   "id": "550e8400-e29b-41d4-a716-446655440000",
     *   "email": "test@test.com",
     *   "role": "authenticated",
     *   ...
     * }
     * 
     * If JWT is invalid/expired, Supabase returns 401 Unauthorized.
     * 
     * @param token JWT token
     * @return User data from Supabase
     * @throws RuntimeException if token verification fails
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyTokenWithSupabase(String token) {
        try {
            // Build URL
            String url = supabaseProjectUrl + "/auth/v1/user";
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            headers.set("apikey", supabaseAnonKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Call Supabase API
            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                Map.class
            );
            
            // Check response
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            } else {
                throw new RuntimeException("Supabase returned invalid response");
            }
            
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new RuntimeException("JWT token is invalid or expired", e);
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("JWT verification failed: " + e.getStatusCode(), e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify JWT with Supabase: " + e.getMessage(), e);
        }
    }

    /**
     * Extracts userId from Supabase user data response.
     * 
     * Supabase response format:
     * {
     *   "id": "550e8400-e29b-41d4-a716-446655440000",  ← User ID here
     *   "email": "test@test.com",
     *   "role": "authenticated",
     *   ...
     * }
     * 
     * @param userData User data from Supabase
     * @return User ID (UUID string)
     * @throws IllegalStateException if userId is missing
     */
    private String extractUserIdFromResponse(Map<String, Object> userData) {
        Object userIdObj = userData.get("id");
        
        if (userIdObj == null) {
            throw new IllegalStateException("User data does not contain 'id' field");
        }
        
        String userId = userIdObj.toString();
        
        if (userId.isEmpty()) {
            throw new IllegalStateException("User ID is empty");
        }
        
        return userId;
    }

    /**
     * Optional: Get full user data from JWT.
     * 
     * Useful if you need email, role, etc. without separate DB query.
     * 
     * @param authHeader Authorization header
     * @return Full user data from Supabase
     */
    public Map<String, Object> getUserData(String authHeader) {
        String token = extractTokenFromHeader(authHeader);
        return verifyTokenWithSupabase(token);
    }

    /**
     * Optional: Get email from JWT.
     * 
     * @param authHeader Authorization header
     * @return User's email
     */
    public String extractEmail(String authHeader) {
        Map<String, Object> userData = getUserData(authHeader);
        Object email = userData.get("email");
        return email != null ? email.toString() : null;
    }

    /**
     * Optional: Get role from JWT.
     *
     * @param authHeader Authorization header
     * @return User's role (e.g., "authenticated")
     */
    public String extractRole(String authHeader) {
        Map<String, Object> userData = getUserData(authHeader);
        Object role = userData.get("role");
        return role != null ? role.toString() : null;
    }

    @SuppressWarnings("unchecked")
    public void verifyAdmin(String authHeader) {
        Map<String, Object> userData = getUserData(authHeader);

        Object appMetaObj = userData.get("app_metadata");
        if (!(appMetaObj instanceof Map)) {
            throw new ForbiddenException("Access denied: not an admin");
        }

        Map<String, Object> appMetadata = (Map<String, Object>) appMetaObj;
        Object role = appMetadata.get("role");
        if (role == null || !"admin".equals(role.toString())) {
            throw new ForbiddenException("Access denied: not an admin");
        }
    }
}