package com.example.courseplanner.repository;

import com.example.courseplanner.entity.RmpMismatchReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RmpMismatchReportRepository extends JpaRepository<RmpMismatchReport, Long> {
}
