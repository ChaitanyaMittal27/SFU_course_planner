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
    private final CourseOfferingRepository offeringRepository;

    public BrowseController(DepartmentRepository departmentRepository, CourseRepository courseRepository, CourseOfferingRepository offeringRepository) {
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.offeringRepository = offeringRepository;
    }

    @GetMapping("/departments")
    public ResponseEntity<List<ApiDepartmentDTO>> getDepartments() {
        List<ApiDepartmentDTO> departmentDTOs = departmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Department::getDeptCode, String.CASE_INSENSITIVE_ORDER))
                .map(department -> new ApiDepartmentDTO(department.getDeptId(), department.getDeptCode()))
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
        List<ApiCourseDTO> courses = courseRepository.findByDepartmentDeptId(deptId).stream()
                .sorted(Comparator.comparing(Course::getCatalogNumber, String.CASE_INSENSITIVE_ORDER))
                .map(course -> new ApiCourseDTO(course.getCourseId(), course.getCatalogNumber()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(courses);
    }

    @GetMapping("/departments/{deptId}/courses/{courseId}/offerings")
    public ResponseEntity<List<ApiCourseOfferingDTO>> getOfferings(
        @PathVariable Long deptId, 
        @PathVariable Long courseId
    ) {
        // Validate course exists
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        // Get all offerings for this course
        List<CourseOffering> offerings = offeringRepository.findByCourseCourseId(courseId);

        // Group by {semester + location} to consolidate sections
        // Key format: "1241_BURNABY"
        Map<String, CourseOffering> groupedMap = new LinkedHashMap<>();
        
        for (CourseOffering offering : offerings) {
            String key = offering.getSemesterCode() + "_" + offering.getLocation();
            
            groupedMap.merge(key, offering, (existing, newOffering) -> {
                // Merge instructors (deduplicate)
                Set<String> instructors = new LinkedHashSet<>();
                if (existing.getInstructors() != null && !existing.getInstructors().isEmpty()) {
                    instructors.addAll(Arrays.asList(existing.getInstructors().split(", ")));
                }
                if (newOffering.getInstructors() != null && !newOffering.getInstructors().isEmpty()) {
                    instructors.addAll(Arrays.asList(newOffering.getInstructors().split(", ")));
                }
                existing.setInstructors(String.join(", ", instructors));
                
                return existing;
            });
        }

        // Convert to DTOs and sort by semester (newest first)
        List<ApiCourseOfferingDTO> offeringDTOs = groupedMap.values().stream()
                .sorted(Comparator.comparing(CourseOffering::getSemesterCode).reversed())
                .map(offering -> new ApiCourseOfferingDTO(
                    offering.getOfferingId(),
                    offering.getLocation(),
                    offering.getInstructors(),
                    getSemesterTerm(offering.getSemesterCode()),
                    offering.getSemesterCode().longValue(),
                    getSemesterYear(offering.getSemesterCode())
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(offeringDTOs);
    }

    @GetMapping("/departments/{deptId}/courses/{courseId}/offerings/{offeringId}")
    public ResponseEntity<List<ApiOfferingSectionDTO>> getSpecificOffering(
            @PathVariable Long deptId,
            @PathVariable Long courseId,
            @PathVariable Long offeringId) {
        
        // Get the main offering
        CourseOffering mainOffering = offeringRepository.findById(offeringId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offering not found"));

        // Get all offerings for the same semester + location
        // (to aggregate section types like your old logic)
        List<CourseOffering> relatedOfferings = offeringRepository.findByCourseCourseId(courseId).stream()
            .filter(o -> o.getSemesterCode().equals(mainOffering.getSemesterCode()) &&
                         o.getLocation().equals(mainOffering.getLocation()))
            .collect(Collectors.toList());

        // Group by section type and aggregate enrollment
        Map<String, ApiOfferingSectionDTO> sectionsMap = new HashMap<>();
        
        for (CourseOffering offering : relatedOfferings) {
            String type = offering.getSectionType();
            
            sectionsMap.merge(type, 
                new ApiOfferingSectionDTO(type, offering.getEnrollmentCap(), offering.getEnrollmentTotal()),
                (existing, newSection) -> {
                    // Aggregate enrollment numbers
                    existing.setEnrollmentCap(existing.getEnrollmentCap() + newSection.getEnrollmentCap());
                    existing.setEnrollmentTotal(existing.getEnrollmentTotal() + newSection.getEnrollmentTotal());
                    return existing;
                }
            );
        }

        // Convert to list and sort
        List<ApiOfferingSectionDTO> sections = new ArrayList<>(sectionsMap.values());
        sections.sort(Comparator.comparing(ApiOfferingSectionDTO::getType, String.CASE_INSENSITIVE_ORDER));

        return ResponseEntity.ok(sections);
    }
    
    // Helper methods to derive semester term and year from semester code
    private String getSemesterTerm(int semesterCode) {
        String codeStr = String.valueOf(semesterCode);
        if (codeStr.length() < 4) return "Unknown";
        
        String termCode = codeStr.substring(3, 4);
        return switch (termCode) {
            case "1" -> "Spring";
            case "4" -> "Summer";
            case "7" -> "Fall";
            default -> "Unknown";
        };
    }

    private int getSemesterYear(int semesterCode) {
        String codeStr = String.valueOf(semesterCode);
        if (codeStr.length() < 3) return 0;
        
        return 1900 + Integer.parseInt(codeStr.substring(0, 3));
    }
}
