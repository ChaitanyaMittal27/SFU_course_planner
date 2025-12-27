package com.example.courseplanner.repository;

import com.example.courseplanner.entity.Watcher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface WatcherRepository extends JpaRepository<Watcher, Long> {

    boolean existsByUserIdAndDeptIdAndCourseIdAndSemesterCodeAndSection(
        Long userId,
        Long deptId,
        Long courseId,
        Long semesterCode,
        String section
    );

    Optional<Watcher> findByUserIdAndDeptIdAndCourseIdAndSemesterCodeAndSection(
        Long userId,
        Long deptId,
        Long courseId,
        Long semesterCode,
        String section
    );

    List<Watcher> findAllByUserId(Long userId);
}
