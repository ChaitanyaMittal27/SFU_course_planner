package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiContactDTO;
import com.example.courseplanner.service.EmailService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final EmailService emailService;

    public ContactController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> submitContactForm(
        @RequestBody ApiContactDTO dto
    ) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (dto.getMessage() == null || dto.getMessage().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required");
        }

        emailService.sendContactFormEmail(dto.getName(), dto.getEmail(), dto.getMessage());

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(Map.of("status", "sent"));
    }
}