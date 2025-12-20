// src/main/java/com/example/courseplanner/repository/CourseRepository.java
package com.example.courseplanner.repository;

import com.example.courseplanner.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    List<Course> findByDepartmentDeptId(Long deptId);
    
    @Query("SELECT c FROM Course c WHERE c.department.deptId = :deptId AND c.catalogNumber = :catalogNumber")
    Optional<Course> findByDeptIdAndCatalogNumber(
        @Param("deptId") Long deptId, 
        @Param("catalogNumber") String catalogNumber
    );
}