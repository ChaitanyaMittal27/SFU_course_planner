/**
 * Controller for statistical data about the model.
 * Exposes endpoints under `/api/stats`, including:
 * - `/students-per-semester`: Aggregates student enrollment data for graph visualization.
 * - `/course-load`: Aggregates course load (enrollment %) per semester for a specific course.
 */

package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.entity.*;
import com.example.courseplanner.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stats")
public class StatsController {
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final CourseOfferingRepository offeringRepository;

    public StatsController(DepartmentRepository departmentRepository, CourseRepository courseRepository, CourseOfferingRepository offeringRepository) {
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.offeringRepository = offeringRepository;
    }

    // ============================================
    // ENDPOINT 1: GET /api/stats/students-per-semester?deptId={deptId}
    // Returns enrollment data aggregated by semester for a department
    // Used for department-level graphs (if you implement them later)
    // ============================================
    @GetMapping("/students-per-semester")
    public ResponseEntity<List<ApiGraphDataPointDTO>> getStudentsPerSemester(@RequestParam Long deptId) {
        // Validate department exists
        Department department = departmentRepository.findById(deptId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        // Get all courses for this department
        List<Course> courses = courseRepository.findByDepartmentDeptId(deptId);
        
        // Get all offerings for all courses in this department
        List<CourseOffering> allOfferings = new ArrayList<>();
        for (Course course : courses) {
            allOfferings.addAll(offeringRepository.findByCourseCourseId(course.getCourseId()));
        }

        // Initialize map with all semesters (to show 0 enrollments)
        Map<Integer, Long> enrollmentsBySemester = new TreeMap<>();
        for (CourseOffering offering : allOfferings) {
            enrollmentsBySemester.putIfAbsent(offering.getSemesterCode(), 0L);
        }

        // Add LEC enrollment totals to the initialized map
        for (CourseOffering offering : allOfferings) {
            // Only count LEC sections
            if ("LEC".equalsIgnoreCase(offering.getSectionType())) {
                long lecEnrollment = offering.getEnrollmentTotal();
                enrollmentsBySemester.merge(
                    offering.getSemesterCode(), 
                    lecEnrollment, 
                    Long::sum
                );
            }
        }

        // Convert to DTOs
        List<ApiGraphDataPointDTO> graphData = enrollmentsBySemester.entrySet().stream()
                .map(entry -> new ApiGraphDataPointDTO(
                    entry.getKey().longValue(), 
                    entry.getValue()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(graphData);
    }

    // ============================================
    // ENDPOINT 2: GET /api/stats/course-load?deptId={deptId}&courseId={courseId}
    // Returns course load (enrollment %) over time for a specific course
    // This is what the Graph page uses!
    // ============================================
    @GetMapping("/course-load")
    public ResponseEntity<List<ApiCourseLoadDTO>> getCourseLoad(
            @RequestParam Long deptId,
            @RequestParam Long courseId) {
        
        // Validate department exists
        Department department = departmentRepository.findById(deptId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        // Validate course exists
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        // Get all offerings for this course
        List<CourseOffering> offerings = offeringRepository.findByCourseCourseId(courseId);

        // Map to aggregate load data by semester
        Map<Integer, LoadAggregator> loadBySemester = new TreeMap<>();

        // Process each offering
        for (CourseOffering offering : offerings) {
            int semesterCode = offering.getSemesterCode();
            
            // Only process LEC sections
            if (!"LEC".equalsIgnoreCase(offering.getSectionType())) {
                continue;
            }

            // Calculate LEC enrollment and capacity for this offering
            int lecEnrolled = offering.getEnrollmentTotal();
            int lecCapacity = offering.getEnrollmentCap();

            // Only process if there's capacity data
            if (lecCapacity > 0) {
                LoadAggregator aggregator = loadBySemester.getOrDefault(
                    semesterCode, 
                    new LoadAggregator()
                );
                
                aggregator.addEnrolled(lecEnrolled);
                aggregator.addCapacity(lecCapacity);
                aggregator.addLocation(offering.getLocation());
                aggregator.addInstructor(offering.getInstructors());
                
                loadBySemester.put(semesterCode, aggregator);
            }
        }

        // Convert to DTOs
        List<ApiCourseLoadDTO> result = loadBySemester.entrySet().stream()
                .map(entry -> {
                    int semester = entry.getKey();
                    LoadAggregator agg = entry.getValue();
                    
                    // Calculate load percentage
                    double load = (agg.capacity > 0) 
                        ? Math.round((agg.enrolled * 100.0 / agg.capacity) * 10.0) / 10.0
                        : 0.0;
                    
                    return new ApiCourseLoadDTO(
                        semester,
                        agg.enrolled,
                        agg.capacity,
                        load,
                        String.join(", ", agg.locations),
                        String.join(", ", agg.instructors)
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
    
    // Helper class for aggregating load data
    private static class LoadAggregator {
        int enrolled = 0;
        int capacity = 0;
        Set<String> locations = new LinkedHashSet<>();
        Set<String> instructors = new LinkedHashSet<>();

        void addEnrolled(int e) { 
            enrolled += e; 
        }
        
        void addCapacity(int c) { 
            capacity += c; 
        }
        
        void addLocation(String loc) { 
            if (loc != null && !loc.trim().isEmpty()) {
                locations.add(loc.trim()); 
            }
        }
        
        void addInstructor(String inst) { 
            if (inst != null && !inst.trim().isEmpty()) {
                // Split multiple instructors and add each
                String[] names = inst.split(",");
                for (String name : names) {
                    String trimmed = name.trim();
                    if (!trimmed.isEmpty()) {
                        instructors.add(trimmed);
                    }
                }
            }
        }
    }
}