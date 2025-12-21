// src/main/java/com/example/courseplanner/repository/CourseStatsRepository.java
package com.example.courseplanner.repository;

import com.example.courseplanner.entity.CourseStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CourseStatsRepository extends JpaRepository<CourseStats, Long> {
    
    // Find stats for a specific course
    Optional<CourseStats> findByCourseCourseId(Long courseId);
}