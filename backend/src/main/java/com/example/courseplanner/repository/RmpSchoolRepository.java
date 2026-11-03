package com.example.courseplanner.repository;

import com.example.courseplanner.entity.RmpSchool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RmpSchoolRepository extends JpaRepository<RmpSchool, String> {

    /** Schools searched during RMP matching. */
    List<RmpSchool> findByActiveTrueOrderByLegacyIdAsc();
}
