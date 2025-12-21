// src/main/java/com/example/courseplanner/repository/CourseRepository.java
package com.example.courseplanner.repository;

import com.example.courseplanner.dto.ApiCourseDTO;
import com.example.courseplanner.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    @Query("""
    SELECT new com.example.courseplanner.dto.ApiCourseDTO(
        c.courseId,
        c.department.deptId,
        c.courseNumber,
        c.title,
        c.description,
        c.units,
        c.degreeLevel,
        c.prerequisites,
        c.corequisites,
        c.designation
    )
    FROM Course c
    WHERE c.department.deptId = :deptId
""")
    List<ApiCourseDTO> findByDeptId(Long deptId);
    
    @Query("SELECT c FROM Course c WHERE c.department.deptId = :deptId AND c.courseNumber = :courseNumber")
    Optional<Course> findByDeptIdAndCourseNumber(
        @Param("deptId") Long deptId, 
        @Param("courseNumber") String courseNumber
    );

    @Query("""
        SELECT c
        FROM Course c
        JOIN FETCH c.department
        WHERE c.courseId = :courseId
    """)
    Optional<Course> findByIdWithDepartment(@Param("courseId") Long courseId);

}