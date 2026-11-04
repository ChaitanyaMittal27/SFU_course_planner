package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiRmpDTO;
import com.example.courseplanner.dto.ApiRmpReportDTO;
import com.example.courseplanner.dto.ApiRmpTeacherDTO;
import com.example.courseplanner.dto.RmpReportRequestDTO;
import com.example.courseplanner.entity.Department;
import com.example.courseplanner.entity.RmpLookup;
import com.example.courseplanner.entity.RmpMismatchReport;
import com.example.courseplanner.entity.RmpSchool;
import com.example.courseplanner.exception.RmpUnavailableException;
import com.example.courseplanner.model.rmp.RmpTeacherProfile;
import com.example.courseplanner.model.rmp.RmpTeacherSearchResult;
import com.example.courseplanner.repository.DepartmentRepository;
import com.example.courseplanner.repository.RmpLookupRepository;
import com.example.courseplanner.repository.RmpMismatchReportRepository;
import com.example.courseplanner.repository.RmpSchoolRepository;
import com.example.courseplanner.service.RateMyProfessorsClient;
import com.example.courseplanner.service.RmpMatcher;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * =========================================================
 * RmpController (public)
 *
 * Rate My Professors ratings for CourseSys instructors.
 *
 * Endpoints:
 * - GET  /api/rmp?name=..&deptCode=..  → ratings for one instructor in one department
 * - POST /api/rmp/reports              → report that a match is wrong
 *
 * Lookup flow (one name + department):
 * 1. Known match              → fetch ratings live from RMP by ID (one request)
 * 2. No-match under 7 days    → NO_MATCH, without calling RMP
 * 3. Otherwise                → search every active SFU school, score candidates
 *                               (RmpMatcher), store the match or no-match
 * Any RMP failure stores nothing and returns UNAVAILABLE; the next request retries.
 * =========================================================
 */
@RestController
@RequestMapping("/api/rmp")
@Tag(name = "Professor ratings", description = "Rate My Professors lookups and wrong-match reports")
public class RmpController {

    private static final Logger log = LoggerFactory.getLogger(RmpController.class);

    static final Duration NO_MATCH_RETRY_AFTER = Duration.ofDays(7);
    private static final int MAX_NAME_LENGTH = 200;
    private static final String SEARCH_URL = "https://www.ratemyprofessors.com/search/professors/1482?q=";
    private static final String PROFILE_URL = "https://www.ratemyprofessors.com/professor/";

    private final RmpLookupRepository rmpLookupRepository;
    private final RmpSchoolRepository rmpSchoolRepository;
    private final RmpMismatchReportRepository rmpMismatchReportRepository;
    private final DepartmentRepository departmentRepository;
    private final RateMyProfessorsClient rateMyProfessorsClient;
    private final RmpMatcher rmpMatcher;
    private final Clock clock;

    public RmpController(
        RmpLookupRepository rmpLookupRepository,
        RmpSchoolRepository rmpSchoolRepository,
        RmpMismatchReportRepository rmpMismatchReportRepository,
        DepartmentRepository departmentRepository,
        RateMyProfessorsClient rateMyProfessorsClient,
        RmpMatcher rmpMatcher,
        @Qualifier("rmpClock") Clock clock
    ) {
        this.rmpLookupRepository = rmpLookupRepository;
        this.rmpSchoolRepository = rmpSchoolRepository;
        this.rmpMismatchReportRepository = rmpMismatchReportRepository;
        this.departmentRepository = departmentRepository;
        this.rateMyProfessorsClient = rateMyProfessorsClient;
        this.rmpMatcher = rmpMatcher;
        this.clock = clock;
    }

    // =====================================================
    // GET /api/rmp?name=Hall, Margaret&deptCode=als
    //
    // Returns: ApiRmpDTO (MATCHED / NO_MATCH / UNAVAILABLE)
    // =====================================================
    @GetMapping
    @Operation(
        summary = "Get RMP ratings for one instructor",
        description = "Pass one CourseSys instructor name (e.g. \"Hall, Margaret\") and the course's "
            + "department code. The first lookup for a name + department searches RMP (about a "
            + "second); later lookups fetch ratings directly. Status is MATCHED, NO_MATCH or "
            + "UNAVAILABLE; searchUrl is always present. No login required.")
    public ApiRmpDTO lookup(
        @Parameter(description = "One raw CourseSys instructor name", example = "Hall, Margaret")
        @RequestParam String name,
        @Parameter(description = "Department code", example = "cmpt")
        @RequestParam String deptCode
    ) {
        String rawName = validateName(name);
        Department department = findDepartment(deptCode);
        String cleanedName = RmpMatcher.cleanName(rawName);
        String searchName = RmpMatcher.displayName(rawName);

        Optional<RmpLookup> existing =
            rmpLookupRepository.findByCleanedNameAndDeptCode(cleanedName, department.getDeptCode());
        try {
            if (existing.isPresent() && !existing.get().getNoMatch()) {
                Optional<ApiRmpDTO> live = liveRatings(existing.get(), searchName);
                if (live.isPresent()) {
                    return live.get();
                }
                // RMP no longer has that profile: identify the professor again below.
            } else if (existing.isPresent() && isRecent(existing.get())) {
                return noMatch(existing.get().getLookupId(), searchName);
            }
            return identify(rawName, cleanedName, searchName, department);
        } catch (RmpUnavailableException exception) {
            log.warn("RMP unavailable for lookup ({}): {}", department.getDeptCode(), exception.getMessage());
            Long lookupId = existing.map(RmpLookup::getLookupId).orElse(null);
            return new ApiRmpDTO(ApiRmpDTO.UNAVAILABLE, lookupId, searchName, searchUrl(searchName), null);
        }
    }

    // =====================================================
    // POST /api/rmp/reports   { "lookupId": 12 }
    //
    // Records that the lookup shows the wrong professor.
    // Anyone may report; no deduplication.
    // Returns: 201 ApiRmpReportDTO, 404 if the lookup does not exist
    // =====================================================
    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        summary = "Report a wrong RMP match",
        description = "Records that the lookup shows the wrong professor, for manual review. "
            + "Anyone can report. Returns 404 if the lookup does not exist.")
    public ApiRmpReportDTO report(@RequestBody RmpReportRequestDTO request) {
        Long lookupId = request == null ? null : request.lookupId();
        if (lookupId == null || lookupId <= 0) {
            throw new IllegalArgumentException("lookupId is required");
        }
        RmpLookup lookup = rmpLookupRepository.findById(lookupId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lookup not found"));
        RmpMismatchReport report = rmpMismatchReportRepository.save(
            new RmpMismatchReport(lookup.getLookupId(), lookup.getRmpTeacherId(), clock.instant()));
        return new ApiRmpReportDTO(report.getReportId());
    }

    // =====================================================
    // Lookup steps
    // =====================================================

    /** One profile request for a known match. Empty if RMP no longer has the profile. */
    private Optional<ApiRmpDTO> liveRatings(RmpLookup lookup, String searchName) {
        Optional<RmpTeacherProfile> profile = callRmp(() ->
            rateMyProfessorsClient.getTeacherProfileStrict(lookup.getRmpTeacherId()));
        return profile.map(teacher -> new ApiRmpDTO(ApiRmpDTO.MATCHED, lookup.getLookupId(), searchName,
            searchUrl(searchName), teacherDTO(teacher, lookup)));
    }

    /** Searches every active school, picks the best candidate, and stores the outcome. */
    private ApiRmpDTO identify(String rawName, String cleanedName, String searchName, Department department) {
        List<RmpSchool> schools = rmpSchoolRepository.findByActiveTrueOrderByLegacyIdAsc();
        if (schools.isEmpty()) {
            throw new IllegalStateException("No active RMP schools configured");
        }
        List<RmpTeacherSearchResult> candidates = callRmp(() ->
            rateMyProfessorsClient.searchTeachersAtSchools(RmpMatcher.nameVariants(rawName), schools));
        Optional<RmpMatcher.Match> match = rmpMatcher.selectBest(candidates, rawName, department.getRmpName());

        Instant now = clock.instant();
        if (match.isEmpty() || match.get().teacher().legacyId() == null) {
            RmpLookup saved = save(rawName, cleanedName, department.getDeptCode(),
                lookup -> lookup.markNoMatch(now));
            return noMatch(saved.getLookupId(), searchName);
        }
        RmpTeacherSearchResult teacher = match.get().teacher();
        RmpLookup saved = save(rawName, cleanedName, department.getDeptCode(),
            lookup -> lookup.markMatched(teacher.rmpTeacherId(), teacher.legacyId(), match.get().score(), now));
        // The search results already carry the ratings, so no extra profile request.
        return new ApiRmpDTO(ApiRmpDTO.MATCHED, saved.getLookupId(), searchName, searchUrl(searchName),
            teacherDTO(teacher, saved));
    }

    /**
     * Creates or updates the lookup row for this name + department. If two requests create
     * the same row at once, the second insert hits the unique constraint; it then updates
     * the row the first one created.
     */
    private RmpLookup save(String rawName, String cleanedName, String deptCode,
                           java.util.function.Consumer<RmpLookup> change) {
        RmpLookup lookup = rmpLookupRepository.findByCleanedNameAndDeptCode(cleanedName, deptCode)
            .orElseGet(() -> new RmpLookup(rawName, cleanedName, deptCode));
        change.accept(lookup);
        try {
            return rmpLookupRepository.saveAndFlush(lookup);
        } catch (DataIntegrityViolationException raced) {
            RmpLookup winner = rmpLookupRepository.findByCleanedNameAndDeptCode(cleanedName, deptCode)
                .orElseThrow(() -> raced);
            change.accept(winner);
            return rmpLookupRepository.saveAndFlush(winner);
        }
    }

    /** Treats any unexpected client failure as RMP being unavailable. */
    private <T> T callRmp(java.util.concurrent.Callable<T> call) {
        try {
            return call.call();
        } catch (RmpUnavailableException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new RmpUnavailableException("RMP request failed", exception);
        }
    }

    private boolean isRecent(RmpLookup lookup) {
        return lookup.getCheckedAt().isAfter(clock.instant().minus(NO_MATCH_RETRY_AFTER));
    }

    // =====================================================
    // Validation
    // =====================================================

    private static String validateName(String name) {
        if (name == null || name.isBlank() || name.length() > MAX_NAME_LENGTH
            || name.codePoints().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Supply one instructor name of 1-200 characters");
        }
        String decoded = RmpMatcher.decode(name);
        if (decoded.contains(";")) {
            throw new IllegalArgumentException("Supply one instructor name, not a list");
        }
        if (decoded.codePoints().noneMatch(Character::isLetter) || RmpMatcher.isPlaceholder(decoded)) {
            throw new IllegalArgumentException("Not an instructor name");
        }
        RmpMatcher.nameVariants(decoded); // rejects "Hall," and similar
        return decoded;
    }

    private Department findDepartment(String deptCode) {
        if (deptCode == null || !deptCode.matches("[A-Za-z]{1,10}")) {
            throw new IllegalArgumentException("Supply a valid department code");
        }
        return departmentRepository.findByDeptCode(deptCode.toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
    }

    // =====================================================
    // DTO mapping
    // =====================================================

    private static ApiRmpTeacherDTO teacherDTO(RmpTeacherProfile teacher, RmpLookup lookup) {
        return new ApiRmpTeacherDTO(teacher.firstName(), teacher.lastName(), teacher.department(),
            teacher.avgRating(), teacher.avgDifficulty(), teacher.numRatings(), teacher.wouldTakeAgainPercent(),
            profileUrl(lookup.getRmpLegacyId() != null ? lookup.getRmpLegacyId() : teacher.legacyId()),
            lookup.getMatchScore());
    }

    private static ApiRmpTeacherDTO teacherDTO(RmpTeacherSearchResult teacher, RmpLookup lookup) {
        return new ApiRmpTeacherDTO(teacher.firstName(), teacher.lastName(), teacher.department(),
            teacher.avgRating(), teacher.avgDifficulty(), teacher.numRatings(), teacher.wouldTakeAgainPercent(),
            profileUrl(lookup.getRmpLegacyId()), lookup.getMatchScore());
    }

    /** ratemyprofessors.com profile link for an RMP numeric ID; null for null. Shared with the admin review. */
    static String profileUrl(Integer legacyId) {
        return legacyId == null ? null : PROFILE_URL + legacyId;
    }

    private static ApiRmpDTO noMatch(Long lookupId, String searchName) {
        return new ApiRmpDTO(ApiRmpDTO.NO_MATCH, lookupId, searchName, searchUrl(searchName), null);
    }

    static String searchUrl(String searchName) {
        return SEARCH_URL + URLEncoder.encode(searchName, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
