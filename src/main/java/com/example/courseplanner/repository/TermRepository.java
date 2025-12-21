// src/main/java/com/example/courseplanner/repository/TermRepository.java
package com.example.courseplanner.repository;

import com.example.courseplanner.entity.Term;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TermRepository extends JpaRepository<Term, Long> {
    
    // Find current semester
    Optional<Term> findByIsCurrentTrue();
    
    // Find enrolling semester
    Optional<Term> findByIsEnrollingTrue();
    
    // Find by year and term
    Optional<Term> findByYearAndTerm(Integer year, String term);
}