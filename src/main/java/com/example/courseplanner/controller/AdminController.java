package com.example.courseplanner.controller;

import com.example.courseplanner.scheduler.NotificationScheduler;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final NotificationScheduler notificationScheduler;

    public AdminController(NotificationScheduler notificationScheduler) {
        this.notificationScheduler = notificationScheduler;
    }

    //@PostMapping("/trigger-notifications")
    //public ResponseEntity<NotificationResult> triggerNotifications() {
    //    NotificationResult result = notificationScheduler.triggerNotifications();
    //    return ResponseEntity.ok(result);
    //}

    @PostMapping("/trigger-notifications")
    public ResponseEntity<Map<String, String>> triggerNotifications() {
        notificationScheduler.triggerNotifications();
        return ResponseEntity.ok(Map.of("status", "triggered"));
}
}