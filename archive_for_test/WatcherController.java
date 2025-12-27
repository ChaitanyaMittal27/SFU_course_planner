package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.entity.*;
import com.example.courseplanner.model.*;
import com.example.courseplanner.repository.*;
import com.example.courseplanner.service.*;
import com.example.courseplanner.utils.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.Comparator;
import java.util.Collections;

/**
 * =========================================================
 * WatcherController
 *
 * Manages user course-offering watchers.
 *
 * Watchers are:
 * - User-scoped
 * - Point to a specific offering
 *   (dept + course + semester + section)
 * - Used to dynamically fetch live offering data
 *
 * NOTE:
 * - No auth yet → userId is passed explicitly
 * - Later: userId will come from auth context
 * =========================================================
 */
@RestController
@RequestMapping("/api/watchers")
public class WatcherController {

    private final WatcherRepository watcherRepository;
    private final CourseRepository courseRepository;
    private final TermRepository termRepository;
    private final CourseSysClient courseSysClient;

    public WatcherController(WatcherRepository watcherRepository, CourseRepository courseRepository, TermRepository termRepository, CourseSysClient courseSysClient) {
        this.watcherRepository = watcherRepository;
        this.courseRepository = courseRepository;
        this.termRepository = termRepository;
        this.courseSysClient = courseSysClient;
    }

    // =====================================================
    // GET /api/watchers/{userId}
    //
    // Returns ALL watchers for a user
    // Used to build the Watchers page list
    // =====================================================
    @GetMapping("/{userId}")
    public List<ApiWatcherDTO> getWatchersForUser(@PathVariable Long userId) {

        return watcherRepository.findAllByUserId(userId)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    
    // =====================================================
    // GET /api/watchers/{userId}/offerings
    //
    // Returns ALL watched offerings for a user
    // Used to populate offering data on dashboard
    // =====================================================
    @GetMapping("/watchers/{userId}/offerings")
    public ResponseEntity<List<ApiCourseOfferingDTO>> getWatchedOfferings(
            @PathVariable Long userId
    ) {
        // 1. Load watchers for user
        List<Watcher> watchers = watcherRepository.findAllByUserId(userId);

        if (watchers.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // 2. Cache enrolling semester once (optional but efficient)
        Optional<Term> enrollingOpt = termRepository.findByIsEnrollingTrue();
        Long enrollingSemesterCode = enrollingOpt
                .map(t -> SemesterUtil.buildSemesterCode(t.getYear(), t.getTerm()))
                .orElse(null);

        List<ApiCourseOfferingDTO> results = new ArrayList<>();

        // 3. Resolve each watcher → CourseSys offering
        for (Watcher watcher : watchers) {

            // a) Validate course
            Course course = courseRepository.findByIdWithDepartment(watcher.getCourseId())
                    .orElseThrow(() ->
                            new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

            String dept = course.getDepartment().getDeptCode();   // CMPT
            String number = course.getCourseNumber();             // 276

            // b) Decode semesterCode → year + term
            SemesterUtil.DecodedSemester decoded =
                    SemesterUtil.decodeSemesterCode(watcher.getSemesterCode());

            long year = decoded.year();
            String term = decoded.term(); // "spring", "fall", etc.

            // c) Fetch CourseSys data for EXACT semester
            CourseSysBrowseResult browse =
                    courseSysClient.fetchCourseSections(dept, number, watcher.getSemesterCode());

            // d) Match exact section
            for (CourseSysOffering offering : browse.getOfferings()) {

                if (!offering.getSection().equalsIgnoreCase(watcher.getSection())) {
                    continue;
                }

                boolean isEnrolling =
                        enrollingSemesterCode != null &&
                        enrollingSemesterCode.equals(watcher.getSemesterCode());

                ApiCourseOfferingDTO dto = new ApiCourseOfferingDTO(
                        offering.getSection(),
                        offering.getInfoUrl(),
                        term,
                        year,
                        watcher.getSemesterCode(),
                        isEnrolling,
                        offering.getCampus(),
                        offering.getInstructor(),
                        offering.getEnrolled(),
                        offering.getCapacity(),
                        offering.getLoadPercent()
                );

                results.add(dto);
                break; // section is unique per semester
            }
        }

        // 4. Sort newest first (same as Browse)
        results.sort(
                Comparator.comparing(ApiCourseOfferingDTO::getSemesterCode).reversed()
        );

        return ResponseEntity.ok(results);
    }


    // =====================================================
    // POST /api/watchers/{userId}
    //
    // Creates a new watcher for a specific offering
    //
    // Body:
    // {
    //   deptId,
    //   courseId,
    //   semesterCode,
    //   section
    // }
    // =====================================================
    @PostMapping("/{userId}")
    public ResponseEntity<ApiWatcherDTO> createWatcher(
        @PathVariable Long userId,
        @RequestBody ApiWatcherDTO payload
    ) {

        // Prevent duplicates (same user + same offering)
        boolean exists = watcherRepository.existsByUserIdAndDeptIdAndCourseIdAndSemesterCodeAndSection(
            userId,
            payload.getDeptId(),
            payload.getCourseId(),
            payload.getSemesterCode(),
            payload.getSection()
        );

        if (exists) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Watcher already exists for this offering"
            );
        }

        // Create entity
        Watcher watcher = new Watcher(
            userId,
            payload.getDeptId(),
            payload.getCourseId(),
            payload.getSemesterCode(),
            payload.getSection()
        );

        Watcher saved = watcherRepository.save(watcher);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(toDTO(saved));
    }

    // =====================================================
    // DELETE /api/watchers/{userId}/{watcherId}
    //
    // Deletes a watcher (user-scoped)
    // =====================================================
    @DeleteMapping("/{userId}/{watcherId}")
    public ResponseEntity<Void> deleteWatcher(
        @PathVariable Long userId,
        @PathVariable Long watcherId
    ) {

        Watcher watcher = watcherRepository.findById(watcherId)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Watcher not found")
            );

        // Ownership check (important for future auth)
        if (!watcher.getUserId().equals(userId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Watcher does not belong to user"
            );
        }

        watcherRepository.delete(watcher);
        return ResponseEntity.noContent().build();
    }

    // =====================================================
    // INTERNAL MAPPER
    //
    // Entity → DTO
    // =====================================================
    private ApiWatcherDTO toDTO(Watcher w) {
        return new ApiWatcherDTO(
            w.getWatcherId(),
            w.getDeptId(),
            w.getCourseId(),
            w.getSemesterCode(),
            w.getSection(),
            w.getCreatedAt()
        );
    }
}
