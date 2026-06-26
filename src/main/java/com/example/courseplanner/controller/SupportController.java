package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.entity.ContactSubmission;
import com.example.courseplanner.repository.ContactSubmissionRepository;
import com.example.courseplanner.service.EmailService;
import com.example.courseplanner.service.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/support")
public class SupportController {

    private final JwtService jwtService;
    private final ContactSubmissionRepository contactSubmissionRepository;
    private final EmailService emailService;

    public SupportController(
        JwtService jwtService,
        ContactSubmissionRepository contactSubmissionRepository,
        EmailService emailService
    ) {
        this.jwtService = jwtService;
        this.contactSubmissionRepository = contactSubmissionRepository;
        this.emailService = emailService;
    }

    @GetMapping("/submissions")
    public ResponseEntity<AdminSupportResponseDTO> getSubmissions(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(value = "filter", defaultValue = "all") String filter
    ) {
        jwtService.verifyAdmin(authHeader);

        List<ContactSubmission> submissions = switch (filter) {
            case "unresolved" -> contactSubmissionRepository
                .findAllByIsRepliedFalseAndIsArchivedFalseOrderByIsReadAscSubmittedAtDesc();
            case "archived" -> contactSubmissionRepository
                .findAllByIsArchivedTrueOrderBySubmittedAtDesc();
            default -> contactSubmissionRepository
                .findAllByIsArchivedFalseOrderBySubmittedAtDesc();
        };

        AdminSupportStatsDTO stats = new AdminSupportStatsDTO();
        stats.setTotalSubmissions((int) contactSubmissionRepository.count());
        stats.setUnreadCount((int) contactSubmissionRepository.countByIsReadFalseAndIsArchivedFalse());
        stats.setArchivedCount(contactSubmissionRepository.findAllByIsArchivedTrueOrderBySubmittedAtDesc().size());

        List<AdminContactSubmissionDTO> dtos = submissions.stream().map(this::toDTO).toList();

        return ResponseEntity.ok(new AdminSupportResponseDTO(stats, dtos));
    }

    @PatchMapping("/submissions/{id}/read")
    public ResponseEntity<AdminContactSubmissionDTO> markAsRead(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable String id
    ) {
        jwtService.verifyAdmin(authHeader);

        ContactSubmission submission = findOrThrow(id);
        submission.setIsRead(true);
        contactSubmissionRepository.save(submission);

        return ResponseEntity.ok(toDTO(submission));
    }

    @PatchMapping("/submissions/{id}/archive")
    public ResponseEntity<AdminContactSubmissionDTO> toggleArchive(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable String id
    ) {
        jwtService.verifyAdmin(authHeader);

        ContactSubmission submission = findOrThrow(id);
        submission.setIsArchived(!submission.getIsArchived());
        contactSubmissionRepository.save(submission);

        return ResponseEntity.ok(toDTO(submission));
    }

    @PostMapping("/submissions/{id}/reply")
    public ResponseEntity<AdminContactSubmissionDTO> reply(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable String id,
        @RequestBody AdminReplyRequestDTO request
    ) {
        jwtService.verifyAdmin(authHeader);

        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply message is required");
        }

        ContactSubmission submission = findOrThrow(id);

        emailService.sendSupportReply(submission.getEmail(), submission.getName(), request.getMessage());

        submission.setIsReplied(true);
        submission.setReplyMessage(request.getMessage());
        submission.setReplySentTo(submission.getEmail());
        submission.setRepliedAt(Instant.now());
        submission.setIsRead(true);
        contactSubmissionRepository.save(submission);

        return ResponseEntity.ok(toDTO(submission));
    }

    private ContactSubmission findOrThrow(String id) {
        return contactSubmissionRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
    }

    private AdminContactSubmissionDTO toDTO(ContactSubmission s) {
        AdminContactSubmissionDTO dto = new AdminContactSubmissionDTO();
        dto.setId(s.getId().toString());
        dto.setName(s.getName());
        dto.setEmail(s.getEmail());
        dto.setReason(s.getReason());
        dto.setMessage(s.getMessage());
        dto.setIsRead(s.getIsRead());
        dto.setIsArchived(s.getIsArchived());
        dto.setIsReplied(s.getIsReplied());
        dto.setReplyMessage(s.getReplyMessage());
        dto.setReplySentTo(s.getReplySentTo());
        dto.setRepliedAt(s.getRepliedAt() != null ? s.getRepliedAt().toString() : null);
        dto.setSubmittedAt(s.getSubmittedAt() != null ? s.getSubmittedAt().toString() : null);
        return dto;
    }
}
