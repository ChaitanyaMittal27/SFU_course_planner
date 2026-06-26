package com.example.courseplanner.repository;

import com.example.courseplanner.entity.ContactSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContactSubmissionRepository extends JpaRepository<ContactSubmission, UUID> {

    List<ContactSubmission> findAllByIsArchivedFalseOrderBySubmittedAtDesc();

    List<ContactSubmission> findAllByIsArchivedTrueOrderBySubmittedAtDesc();

    List<ContactSubmission> findAllByIsRepliedFalseAndIsArchivedFalseOrderByIsReadAscSubmittedAtDesc();

    List<ContactSubmission> findAllByIsRepliedTrueAndIsArchivedFalseOrderByRepliedAtDesc();

    long countByIsReadFalseAndIsArchivedFalse();
}
