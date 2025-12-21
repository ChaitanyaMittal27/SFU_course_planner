// src/main/java/com/example/courseplanner/repository/CourseDiggerMapRepository.java
package com.example.courseplanner.repository;

import com.example.courseplanner.entity.CourseDiggerMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CourseDiggerMapRepository extends JpaRepository<CourseDiggerMap, Long> {
    
    // Find map entry for a course
    Optional<CourseDiggerMap> findByCourseCourseId(Long courseId);
    
    // Find by CourseDiggers ID
    Optional<CourseDiggerMap> findByDiggerCourseId(Integer diggerCourseId);
}