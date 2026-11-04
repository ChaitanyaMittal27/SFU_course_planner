package com.example.courseplanner.controller;

import com.example.courseplanner.dto.AdminRmpProfessorRequestDTO;
import com.example.courseplanner.dto.AdminRmpReportDTO;
import com.example.courseplanner.dto.ApiRmpDTO;
import com.example.courseplanner.entity.RmpLookup;
import com.example.courseplanner.entity.RmpSchool;
import com.example.courseplanner.model.rmp.RmpTeacherProfile;
import com.example.courseplanner.repository.RmpLookupRepository;
import com.example.courseplanner.repository.RmpMismatchReportRepository;
import com.example.courseplanner.repository.RmpMismatchReportRepository.OpenReportSummary;
import com.example.courseplanner.repository.RmpSchoolRepository;
import com.example.courseplanner.service.JwtService;
import com.example.courseplanner.service.RateMyProfessorsClient;
import com.example.courseplanner.service.RmpMatcher;
import io.swagger.v3.oas.annotations.Hidden;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * =========================================================
 * AdminRmpController (admin only)
 *
 * Review of Rate My Professors wrong-match reports.
 *
 * Endpoints:
 * - GET   /api/admin/rmp/reports                       → lookups with open reports
 * - PATCH /api/admin/rmp/reports/{lookupId}/dismiss    → "match is correct": resolve, change nothing
 * - PATCH /api/admin/rmp/reports/{lookupId}/no-match   → set the lookup to no-match, resolve
 * - PATCH /api/admin/rmp/reports/{lookupId}/professor  → point the lookup at a given RMP professor, resolve
 *
 * Every action resolves all open reports of that lookup. A no-match set here is
 * searched again after 7 days like any other no-match.
 * =========================================================
 */
@RestController
@RequestMapping("/api/admin/rmp")
@Hidden
public class AdminRmpController {

    private static final Logger log = LoggerFactory.getLogger(AdminRmpController.class);

    private final JwtService jwtService;
    private final RmpLookupRepository rmpLookupRepository;
    private final RmpMismatchReportRepository rmpMismatchReportRepository;
    private final RmpSchoolRepository rmpSchoolRepository;
    private final RateMyProfessorsClient rateMyProfessorsClient;
    private final Clock clock;

    public AdminRmpController(
        JwtService jwtService,
        RmpLookupRepository rmpLookupRepository,
        RmpMismatchReportRepository rmpMismatchReportRepository,
        RmpSchoolRepository rmpSchoolRepository,
        RateMyProfessorsClient rateMyProfessorsClient,
        @Qualifier("rmpClock") Clock clock
    ) {
        this.jwtService = jwtService;
        this.rmpLookupRepository = rmpLookupRepository;
        this.rmpMismatchReportRepository = rmpMismatchReportRepository;
        this.rmpSchoolRepository = rmpSchoolRepository;
        this.rateMyProfessorsClient = rateMyProfessorsClient;
        this.clock = clock;
    }

    // =====================================================
    // GET /api/admin/rmp/reports
    //
    // Returns: one row per lookup with open reports, most reported first
    // =====================================================
    @GetMapping("/reports")
    public ResponseEntity<List<AdminRmpReportDTO>> getOpenReports(
        @RequestHeader("Authorization") String authHeader
    ) {
        jwtService.verifyAdmin(authHeader);

        List<OpenReportSummary> summaries = rmpMismatchReportRepository.findOpenReportSummaries();
        Map<Long, RmpLookup> lookups = rmpLookupRepository
            .findAllById(summaries.stream().map(OpenReportSummary::getLookupId).toList())
            .stream()
            .collect(Collectors.toMap(RmpLookup::getLookupId, Function.identity()));

        // Reports are deleted with their lookup, so a missing lookup is only a concurrent delete.
        List<AdminRmpReportDTO> rows = summaries.stream()
            .filter(summary -> lookups.containsKey(summary.getLookupId()))
            .map(summary -> toDTO(lookups.get(summary.getLookupId()), summary))
            .toList();
        return ResponseEntity.ok(rows);
    }

    // =====================================================
    // PATCH /api/admin/rmp/reports/{lookupId}/dismiss
    //
    // "Match is correct": resolves the reports and leaves the lookup as it is.
    // Returns: 204, 404 if the lookup does not exist
    // =====================================================
    @PatchMapping("/reports/{lookupId}/dismiss")
    public ResponseEntity<Void> dismiss(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable Long lookupId
    ) {
        jwtService.verifyAdmin(authHeader);

        RmpLookup lookup = findLookup(lookupId);
        rmpMismatchReportRepository.resolveOpenReports(lookup.getLookupId(), clock.instant());
        return ResponseEntity.noContent().build();
    }

    // =====================================================
    // PATCH /api/admin/rmp/reports/{lookupId}/no-match
    //
    // The professor is not on RMP: clears the match and resolves the reports.
    // Returns: 204, 404 if the lookup does not exist
    // =====================================================
    @PatchMapping("/reports/{lookupId}/no-match")
    @Transactional
    public ResponseEntity<Void> setNoMatch(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable Long lookupId
    ) {
        jwtService.verifyAdmin(authHeader);

        RmpLookup lookup = findLookup(lookupId);
        Instant now = clock.instant();
        lookup.markNoMatch(now);
        rmpLookupRepository.save(lookup);
        rmpMismatchReportRepository.resolveOpenReports(lookup.getLookupId(), now);
        return ResponseEntity.noContent().build();
    }

    // =====================================================
    // PATCH /api/admin/rmp/reports/{lookupId}/professor   { "legacyId": 3030010 }
    //
    // Points the lookup at the given RMP professor and resolves the reports.
    // Returns: 204
    //          400 invalid legacyId, or the professor is not at an active SFU listing
    //          404 unknown lookup, or no RMP professor with that ID
    //          503 RMP could not be reached
    // =====================================================
    @PatchMapping("/reports/{lookupId}/professor")
    @Transactional
    public ResponseEntity<Void> setProfessor(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable Long lookupId,
        @RequestBody AdminRmpProfessorRequestDTO request
    ) {
        jwtService.verifyAdmin(authHeader);

        Integer legacyId = request == null ? null : request.legacyId();
        if (legacyId == null || legacyId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "legacyId must be a positive RMP professor ID");
        }
        RmpLookup lookup = findLookup(lookupId);

        String teacherId = teacherId(legacyId);
        RmpTeacherProfile profile = fetchProfile(teacherId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No RMP professor with that ID"));
        Set<String> sfuSchools = rmpSchoolRepository.findByActiveTrueOrderByLegacyIdAsc().stream()
            .map(RmpSchool::getRmpSchoolId)
            .collect(Collectors.toSet());
        if (!sfuSchools.contains(profile.rmpSchoolId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That professor is not at an SFU listing");
        }

        Instant now = clock.instant();
        lookup.markMatched(
            Objects.requireNonNullElse(profile.rmpTeacherId(), teacherId),
            Objects.requireNonNullElse(profile.legacyId(), legacyId),
            null,
            now);
        rmpLookupRepository.save(lookup);
        rmpMismatchReportRepository.resolveOpenReports(lookup.getLookupId(), now);
        return ResponseEntity.noContent().build();
    }

    // =====================================================
    // Helpers
    // =====================================================

    private RmpLookup findLookup(Long lookupId) {
        return rmpLookupRepository.findById(lookupId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lookup not found"));
    }

    /** RMP's GraphQL ID for a numeric professor ID: base64 of "Teacher-{legacyId}". */
    static String teacherId(int legacyId) {
        return Base64.getEncoder().encodeToString(("Teacher-" + legacyId).getBytes(StandardCharsets.UTF_8));
    }

    /** Any RMP failure becomes 503, so it is never mistaken for "no such professor". */
    private Optional<RmpTeacherProfile> fetchProfile(String teacherId) {
        try {
            return rateMyProfessorsClient.getTeacherProfileStrict(teacherId);
        } catch (Exception exception) {
            log.warn("RMP unavailable while setting a professor: {}", exception.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not reach Rate My Professors");
        }
    }

    private static AdminRmpReportDTO toDTO(RmpLookup lookup, OpenReportSummary summary) {
        boolean noMatch = Boolean.TRUE.equals(lookup.getNoMatch());
        return new AdminRmpReportDTO(
            lookup.getLookupId(),
            lookup.getRawName(),
            RmpMatcher.displayName(lookup.getRawName()),
            lookup.getDeptCode(),
            noMatch ? ApiRmpDTO.NO_MATCH : ApiRmpDTO.MATCHED,
            lookup.getRmpLegacyId(),
            RmpController.profileUrl(lookup.getRmpLegacyId()),
            lookup.getMatchScore(),
            summary.getOpenReports(),
            isoOrNull(summary.getFirstReportedAt()),
            isoOrNull(summary.getLastReportedAt())
        );
    }

    private static String isoOrNull(Instant instant) {
        return instant == null ? null : instant.toString();
    }
}
