package com.example.courseplanner.repository;

import com.example.courseplanner.entity.RmpLookup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RmpLookupRepository extends JpaRepository<RmpLookup, Long> {

    /** The stored identification for an instructor name in a department, if any. */
    Optional<RmpLookup> findByCleanedNameAndDeptCode(String cleanedName, String deptCode);
}
