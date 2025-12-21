/**
 * Controller to handle browsing of departments, courses, and offerings.
 * Exposes multiple endpoints:
 * - `/api/departments`: Lists all departments.
 * - `/api/departments/{deptId}/courses`: Lists courses in a department.
 * - `/api/departments/{deptId}/courses/{courseId}/offerings`: Lists offerings for a course.
 * - `/api/departments/{deptId}/courses/{courseId}/offerings/{offeringId}`: Details of a specific offering.
 */


package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.entity.*;
import com.example.courseplanner.repository.*;
import com.example.courseplanner.model.*;
import com.example.courseplanner.service.CourseSysClient;
import com.example.courseplanner.utils.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class BrowseController {
    // inject jpa repositories or services as needed
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final TermRepository termRepository;
    private final CourseSysClient courseSysClient;
    private final CourseDiggerStatsRepository courseDiggerStatsRepository;

    public BrowseController(DepartmentRepository departmentRepository, CourseRepository courseRepository, TermRepository termRepository, CourseSysClient courseSysClient, CourseDiggerStatsRepository courseDiggerStatsRepository) {
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.termRepository = termRepository;
        this.courseSysClient = courseSysClient;
        this.courseDiggerStatsRepository = courseDiggerStatsRepository;
    }

    @GetMapping("/departments")
    public ResponseEntity<List<ApiDepartmentDTO>> getDepartments() {
        List<ApiDepartmentDTO> departmentDTOs = departmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Department::getDeptCode, String.CASE_INSENSITIVE_ORDER))
                .map(department -> new ApiDepartmentDTO(department.getDeptId(), department.getDeptCode(), department.getName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(departmentDTOs); // Return 200 OK with the list of departments
    }
    
    @GetMapping("/departments/{deptId}/courses")
    public ResponseEntity<List<ApiCourseDTO>> getCourses(@PathVariable Long deptId) {
        // Validate department exists
        if (!departmentRepository.existsById(deptId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        // Query database for courses in this department
        List<ApiCourseDTO> courses = courseRepository.findByDeptId(deptId).stream()
                .map(course -> new ApiCourseDTO(course.getCourseId(),
                    deptId,
                    course.getCourseNumber(),
                    course.getTitle(),
                    course.getDescription(),
                    Optional.ofNullable(course.getUnits()).orElse(0L),
                    course.getDegreeLevel(),
                    course.getPrerequisites(),
                    course.getCorequisites(),
                    course.getDesignation()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(courses);
    }

    @GetMapping("/departments/{deptId}/courses/{courseId}/offerings")
    public ResponseEntity<List<ApiCourseOfferingDTO>> getOfferings(
            @PathVariable Long deptId,
            @PathVariable Long courseId
    ) {
        // 1. Validate course
        Course course = courseRepository.findByIdWithDepartment(courseId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        String dept = course.getDepartment().getDeptCode();   // CMPT
        String number = course.getCourseNumber();             // 276

        // 2. Get enrolling term (optional)
        Optional<Term> enrollingOpt = termRepository.findByIsEnrollingTrue();

        long year;
        String term;
        long semesterCode;

        if (enrollingOpt.isPresent()) {
            Term enrolling = enrollingOpt.get();
            year = enrolling.getYear();        // 2026
            term = enrolling.getTerm();        // spring
            semesterCode = SemesterUtil.buildSemesterCode(year, term);
        } else {
            // fallback to current term or latest known term
            Term current = termRepository.findByIsCurrentTrue()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.INTERNAL_SERVER_ERROR, "No term data"));

            year = current.getYear();
            term = current.getTerm();
            semesterCode = SemesterUtil.buildSemesterCode(year, term);
        }

        List<ApiCourseOfferingDTO> results = new ArrayList<>();

        // 3. Iterate backwards 12 semesters (4 years * 3 semesters)
        for (int i = 0; i < 12; i++) {

            CourseSysBrowseResult browse =
                    courseSysClient.fetchCourseSections(dept, number, semesterCode);

            boolean isEnrolling = (i == 0 && enrollingOpt.isPresent());

            for (CourseSysOffering offering : browse.getOfferings()) {                       
                ApiCourseOfferingDTO dto = new ApiCourseOfferingDTO(
                        offering.getSection(),
                        offering.getInfoUrl(),
                        capitalize(term), // spring
                        year,
                        semesterCode, // 1247
                        isEnrolling,
                        offering.getCampus(),
                        offering.getInstructor(),
                        offering.getEnrolled(),
                        offering.getCapacity(),
                        offering.getLoadPercent()
                );

                results.add(dto);
            }

            // move to previous semester
            SemesterUtil.Prev prev = SemesterUtil.previous(year, term);
            year = prev.year();
            term = prev.term();
            semesterCode = prev.semesterCode();
        }

        return ResponseEntity.ok(results);
    }

    @GetMapping("/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}")
    public ResponseEntity<ApiOfferingDetailDTO> getOfferingDetail(
            @PathVariable Long deptId,
            @PathVariable Long courseId,
            @PathVariable Long semesterCode
    ) {

        // 1. Validate DB entities
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));

        Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Department not found"));

        // 2. Fetch CourseSys data for this semester
        CourseSysBrowseResult csResult =
                courseSysClient.fetchCourseSections(
                        dept.getDeptCode(),
                        course.getCourseNumber(),
                        semesterCode
                );

        // 3. Map sections
        List<ApiCourseOfferingDTO> sections = csResult.getOfferings().stream()
                .map(o -> new ApiCourseOfferingDTO(
                        o.getSection(),
                        o.getInfoUrl(),
                        csResult.getSemester(),
                        csResult.getYear(),
                        csResult.getSemesterCode(),
                        false,
                        o.getCampus(),
                        o.getInstructor(),
                        o.getEnrolled(),
                        o.getCapacity(),
                        o.getLoadPercent()
                ))
                .toList();

        // 4. CourseDiggers stats (optional)
        CourseDiggerStats stats = courseDiggerStatsRepository
                .findByCourseCourseId(courseId)
                .orElse(null);

        // 5. Assemble DTO
        // ---- Resolve course + dept info ----
        String deptCode = dept.getDeptCode();
        String courseNumber = course.getCourseNumber();
        String title = course.getTitle();

        // ---- Resolve term info ----
        long year = csResult.getYear();
        String term = csResult.getSemester();

        // ---- Resolve campus (from sections if available) ----
        String campus = sections.isEmpty()
                ? null
                : sections.get(0).getLocation();

        // ---- Resolve CourseDiggers stats ----
        String medianGrade = null;
        double failRate = 0.0;
        Map<String, Long> gradeDistribution = null;

        if (stats != null) {
            medianGrade = stats.getMedianGrade();

            if (stats.getFailRate() != null) {
                failRate = stats.getFailRate().doubleValue();
            }
        }

        if (stats != null && stats.getGradeDistribution() != null) {
            gradeDistribution = new HashMap<>();

            for (Map.Entry<String, Object> entry : stats.getGradeDistribution().entrySet()) {
                Object value = entry.getValue();

                if (value instanceof Number) {
                    gradeDistribution.put(entry.getKey(), ((Number) value).longValue());
                }
            }
        }

        // ---- Resolve course metadata ----
        String description = course.getDescription();
        String prerequisites = course.getPrerequisites();
        String corequisites = course.getCorequisites();
        long units = Optional.ofNullable(course.getUnits()).orElse(0L);
        String degreeLevel = course.getDegreeLevel();
        String designation = course.getDesignation();

        // ---- Resolve outline URL ----
        String outlineUrl =
                "https://www.sfu.ca/outlines.html?dept="
                        + deptCode
                        + "&number=" + courseNumber;

        // ---- Final DTO construction ----
        ApiOfferingDetailDTO dto = new ApiOfferingDetailDTO(
                deptCode,
                courseNumber,
                title,
                year,
                term,
                campus,
                medianGrade,
                failRate,
                gradeDistribution,
                description,
                prerequisites,
                corequisites,
                units,
                degreeLevel,
                designation,
                sections,
                outlineUrl
        );
        return ResponseEntity.ok(dto);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
