package com.example.courseplanner.controller;

import com.example.courseplanner.scheduler.NotificationScheduler;
import com.example.courseplanner.service.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/test")
public class TestController {

    private final NotificationScheduler notificationScheduler;
    private final JwtService jwtService;

    public TestController(NotificationScheduler notificationScheduler, JwtService jwtService) {
        this.notificationScheduler = notificationScheduler;
        this.jwtService = jwtService;
    }

    @PostMapping("/trigger-notifications")
    public ResponseEntity<Map<String, String>> triggerNotifications(
        @RequestHeader("Authorization") String authHeader
    ) {
        jwtService.verifyAdmin(authHeader);
        notificationScheduler.triggerNotifications();
        return ResponseEntity.ok(Map.of("status", "triggered"));
    }
}
