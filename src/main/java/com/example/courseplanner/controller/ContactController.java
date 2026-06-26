package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiContactDTO;
import com.example.courseplanner.entity.ContactSubmission;
import com.example.courseplanner.repository.ContactSubmissionRepository;
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
    private final ContactSubmissionRepository contactSubmissionRepository;

    public ContactController(EmailService emailService, ContactSubmissionRepository contactSubmissionRepository) {
        this.emailService = emailService;
        this.contactSubmissionRepository = contactSubmissionRepository;
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

        String emailMessage = dto.getReason() != null
            ? dto.getReason() + ": " + dto.getMessage()
            : dto.getMessage();
        emailService.sendContactFormEmail(dto.getName(), dto.getEmail(), emailMessage);

        ContactSubmission submission = new ContactSubmission();
        submission.setName(dto.getName());
        submission.setEmail(dto.getEmail());
        submission.setReason(dto.getReason());
        submission.setMessage(dto.getMessage());
        contactSubmissionRepository.save(submission);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(Map.of("status", "sent"));
    }
}