package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.entity.*;
import com.example.courseplanner.model.*;
import com.example.courseplanner.repository.*;
import com.example.courseplanner.service.CourseSysClient;
import com.example.courseplanner.utils.SemesterUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * =========================================================
 * StatsController
 *
 * Handles statistical data for graph visualization.
 *
 * Endpoints:
 * 1. /api/stats/grade-distribution?courseId={}
 *    - Returns CourseDiggers grade data (static)
 *    - Used for Chart C: Grade Distribution bar chart
 *
 * 2. /api/stats/enrollment-history?deptId={}&courseId={}&range=5yr
 *    - Returns time-series enrollment data (dynamic CourseSys API)
 *    - Used for Chart A: Load Over Time
 *    - Used for Chart B: Enrollment vs Capacity
 *
 * =========================================================
 */
@RestController
@RequestMapping("/api/graph")
public class GraphController {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final TermRepository termRepository;
    private final CourseDiggerStatsRepository courseDiggerStatsRepository;
    private final CourseSysClient courseSysClient;

    public GraphController(
        CourseRepository courseRepository,
        DepartmentRepository departmentRepository,
        TermRepository termRepository,
        CourseDiggerStatsRepository courseDiggerStatsRepository,
        CourseSysClient courseSysClient
    ) {
        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.termRepository = termRepository;
        this.courseDiggerStatsRepository = courseDiggerStatsRepository;
        this.courseSysClient = courseSysClient;
    }

    // =====================================================
    // ENDPOINT 1: GET /api/graph/grade-distribution
    //
    // Returns grade distribution data from CourseDiggers
    // Used for Chart C (static bar chart)
    //
    // Query params:
    // - courseId: Course to get grades for
    //
    // Returns: ApiGradeDistributionDTO
    // =====================================================
    @GetMapping("/grade-distribution")
    public ResponseEntity<ApiGradeDistributionDTO> getGradeDistribution(
        @RequestParam Long courseId
    ) {
        // 1. Validate course exists and fetch with department
        Course course = courseRepository.findByIdWithDepartment(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));

        // 2. Fetch CourseDiggers stats
        CourseDiggerStats stats = courseDiggerStatsRepository
                .findByCourseCourseId(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, 
                        "Grade distribution not available for this course"));

        // 3. Extract department and course info
        String deptCode = course.getDepartment().getDeptCode();
        String courseNumber = course.getCourseNumber();
        String title = course.getTitle();

        // 4. Extract grade stats
        String medianGrade = stats.getMedianGrade();
        Double failRate = stats.getFailRate();

        // 5. Convert grade distribution Map<String, Object> to Map<String, Long>
        Map<String, Long> distribution = new HashMap<>();
        
        if (stats.getGradeDistribution() != null) {
            for (Map.Entry<String, Object> entry : stats.getGradeDistribution().entrySet()) {
                String grade = entry.getKey();
                Object value = entry.getValue();
                
                // Skip non-grade keys (like "Median Grade", "Fail Rate")
                if (grade.matches("^[A-F][+-]?$") || grade.equals("F")) {
                    if (value instanceof Number) {
                        distribution.put(grade, ((Number) value).longValue());
                    }
                }
            }
        }

        // 6. Build and return DTO
        ApiGradeDistributionDTO dto = new ApiGradeDistributionDTO(
            deptCode,
            courseNumber,
            title,
            medianGrade,
            failRate,
            distribution
        );

        return ResponseEntity.ok(dto);
    }

    // =====================================================
    // ENDPOINT 2: GET /api/graph/enrollment-history
    //
    // Returns time-series enrollment data for a course
    // Fetches live data from CourseSys API
    // Used for Charts A & B
    //
    // Query params:
    // - deptId: Department ID
    // - courseId: Course ID
    // - range: Time range (e.g., "5yr", "3yr", "1yr")
    //
    // Returns: List<ApiEnrollmentDataPointDTO>
    // =====================================================
    @GetMapping("/enrollment-history")
    public ResponseEntity<List<ApiEnrollmentDataPointDTO>> getEnrollmentHistory(
        @RequestParam Long deptId,
        @RequestParam Long courseId,
        @RequestParam(defaultValue = "3yr") String range
    ) {
        // 1. Validate course exists and fetch with department
        Course course = courseRepository.findByIdWithDepartment(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));

        String dept = course.getDepartment().getDeptCode();   // CMPT
        String number = course.getCourseNumber();             // 276

        // 2. Parse range to get number of years
        int numYears = parseRangeToYears(range);

        // 3. Get current year (from enrolling or current term)
        Optional<Term> enrollingOpt = termRepository.findByIsEnrollingTrue();
        
        int currentYear;

        if (enrollingOpt.isPresent()) {
            currentYear = enrollingOpt.get().getYear();
        } else {
            // Fallback to current term
            Term current = termRepository.findByIsCurrentTrue()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.INTERNAL_SERVER_ERROR, "No term data"));
            currentYear = current.getYear();
        }

        // 4. Define semester list
        String[] semesters = {"spring", "summer", "fall"};

        // 5. Iterate and collect data points
        List<ApiEnrollmentDataPointDTO> results = new ArrayList<>();

        // Outer loop: years (backwards from current)
        for (int yearOffset = 0; yearOffset < numYears; yearOffset++) {
            int year = currentYear - yearOffset;

            // Inner loop: semesters (spring, summer, fall)
            for (String term : semesters) {
                
                // Build semester code
                long semesterCode = SemesterUtil.buildSemesterCode(year, term);

                // Fetch CourseSys data for this semester
                CourseSysBrowseResult browse =
                        courseSysClient.fetchCourseSections(dept, number, semesterCode);

                // Aggregate LEC sections only
                int totalEnrolled = 0;
                int totalCapacity = 0;

                for (CourseSysOffering offering : browse.getOfferings()) {
                    // Only count LEC sections (D100, E100, etc.)
                    if (offering.getSection().matches("^[A-Z]\\d+$")) {
                        totalEnrolled += offering.getEnrolledCount();
                        totalCapacity += offering.getCapacityCount();
                    }
                }

                // Only add data point if there was actual data
                if (totalCapacity > 0) {
                    double loadPercent = Math.round((totalEnrolled * 100.0 / totalCapacity) * 10.0) / 10.0;

                    ApiEnrollmentDataPointDTO dto = new ApiEnrollmentDataPointDTO(
                        semesterCode,
                        capitalize(term),
                        (long) year,
                        totalEnrolled,
                        totalCapacity,
                        loadPercent
                    );

                    results.add(dto);
                }
            }
        }

        // 6. Reverse to get chronological order (oldest first)
        Collections.reverse(results);

        return ResponseEntity.ok(results);
    }

    // =====================================================
    // HELPER: Parse range string to number of years
    // =====================================================
    private int parseRangeToYears(String range) {
        return switch (range.toLowerCase()) {
            case "1yr" -> 1;
            case "3yr" -> 3;
            case "5yr" -> 5;
            default -> 3;  // Default to 3 years
        };
    }

    // =====================================================
    // HELPER: Capitalize first letter
    // =====================================================
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

}