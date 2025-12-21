// src/main/java/com/example/courseplanner/repository/CourseDiggerStatsRepository.java
package com.example.courseplanner.repository;

import com.example.courseplanner.entity.CourseDiggerStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CourseDiggerStatsRepository extends JpaRepository<CourseDiggerStats, Long> {
    
    // Find stats via the map relationship
    Optional<CourseDiggerStats> findByDiggerMapMapId(Long mapId);
    
    // Find stats directly by course ID (via join)
    @Query("SELECT s FROM CourseDiggerStats s " +
           "WHERE s.diggerMap.course.courseId = :courseId")
    Optional<CourseDiggerStats> findByCourseCourseId(@Param("courseId") Long courseId);
}