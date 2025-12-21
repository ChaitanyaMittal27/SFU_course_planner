package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.entity.*;
import com.example.courseplanner.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/watchers")
public class WatcherController {
    
    // ============================================
    // INJECT JPA REPOSITORIES (new!)
    // ============================================
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    
    // ============================================
    // IN-MEMORY WATCHER STORAGE (temporary - Phase 1)
    // In Phase 2, we'll replace this with a watchers table
    // ============================================
    private final Map<Long, ApiWatcherDTO> watchers = new HashMap<>();
    private final AtomicLong watcherIdCounter = new AtomicLong(1);

    public WatcherController(
        DepartmentRepository departmentRepository,
        CourseRepository courseRepository
    ) {
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
    }

    // ============================================
    // ENDPOINT 1: GET /api/watchers
    // Returns list of all watchers
    // ============================================
    @GetMapping
    public List<ApiWatcherDTO> listWatchers() {
        return new ArrayList<>(watchers.values());
    }

    // ============================================
    // ENDPOINT 2: POST /api/watchers
    // Creates a new watcher for a course
    // Request body: {"deptId": 1, "courseId": 5}
    // ============================================
    @PostMapping
    public ResponseEntity<String> createWatcher(@RequestBody ApiWatcherCreateDTO data) {
        // Validate department exists (using JPA now!)
        Department department = departmentRepository.findById(data.getDeptId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        // Validate course exists (using JPA now!)
        Course course = courseRepository.findById(data.getCourseId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        // Check if watcher already exists
        boolean alreadyExists = watchers.values().stream()
            .anyMatch(w -> 
                w.getDepartment().getDeptId() == data.getDeptId() &&
                w.getCourse().getCourseId() == data.getCourseId()
            );
        
        if (alreadyExists) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("Watcher already exists for this course");
        }

        // Create new watcher
        long watcherId = watcherIdCounter.getAndIncrement();
        
        ApiDepartmentDTO departmentDTO = new ApiDepartmentDTO(
            department.getDeptId(), 
            department.getDeptCode()
        );
        
        ApiCourseDTO courseDTO = new ApiCourseDTO(
            course.getCourseId(), 
            course.getCatalogNumber()
        );
        
        ApiWatcherDTO newWatcher = new ApiWatcherDTO(
            watcherId, 
            departmentDTO, 
            courseDTO, 
            new ArrayList<>()  // Empty events list
        );

        watchers.put(watcherId, newWatcher);
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body("Watcher created with ID: " + watcherId);
    }

    // ============================================
    // ENDPOINT 3: GET /api/watchers/{watcherId}
    // Returns details of a specific watcher
    // ============================================
    @GetMapping("/{watcherId}")
    public ResponseEntity<ApiWatcherDTO> getWatcher(@PathVariable Long watcherId) {
        ApiWatcherDTO watcher = watchers.get(watcherId);
        
        if (watcher == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        
        return ResponseEntity.ok(watcher);
    }

    // ============================================
    // ENDPOINT 4: DELETE /api/watchers/{watcherId}
    // Deletes a watcher
    // ============================================
    @DeleteMapping("/{watcherId}")
    public ResponseEntity<String> deleteWatcher(@PathVariable Long watcherId) {
        ApiWatcherDTO watcher = watchers.remove(watcherId);
        
        if (watcher == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Watcher not found");
        }
        
        return ResponseEntity.ok("Watcher deleted");
    }

    // ============================================
    // HELPER METHOD: Record events when offerings change
    // Called by AddOfferingController
    // ============================================
    public void recordEvent(String subjectName, String catalogNumber, String event) {
        // Find all watchers matching this department + course
        watchers.values().stream()
            .filter(watcher ->
                watcher.getDepartment().getName().equalsIgnoreCase(subjectName) &&
                watcher.getCourse().getCatalogNumber().equalsIgnoreCase(catalogNumber)
            )
            .forEach(watcher -> watcher.getEvents().add(event));
    }
}