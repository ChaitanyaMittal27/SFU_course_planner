// src/main/java/com/example/courseplanner/repository/CourseOfferingRepository.java
package com.example.courseplanner.repository;

import com.example.courseplanner.entity.CourseOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseOfferingRepository extends JpaRepository<CourseOffering, Long> {
    
    List<CourseOffering> findByCourseCourseId(Long courseId);
    
    @Query("SELECT o FROM CourseOffering o WHERE o.course.courseId = :courseId ORDER BY o.semesterCode DESC")
    List<CourseOffering> findByCourseCourseIdOrderBySemesterCodeDesc(@Param("courseId") Long courseId);
}