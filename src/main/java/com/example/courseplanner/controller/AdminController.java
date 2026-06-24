package com.example.courseplanner.controller;

import com.example.courseplanner.service.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final JwtService jwtService;

    public AdminController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAdminStatus(
        @RequestHeader("Authorization") String authHeader
    ) {
        jwtService.verifyAdmin(authHeader);

        return ResponseEntity.ok(Map.of(
            "authenticated", true,
            "role", "admin",
            "availablePaths", List.of(
                "/api/admin/health",
                "/api/admin/support",
                "/api/admin/terms",
                "/api/admin/users",
                "/api/admin/bookmarks",
                "/api/admin/notifications",
                "/api/admin/test"
            )
        ));
    }
}
