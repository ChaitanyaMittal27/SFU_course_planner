package com.example.courseplanner.dto;

/**
 * Body of PATCH /api/admin/rmp/reports/{lookupId}/professor.
 *
 * @param legacyId RMP numeric professor ID, the number in ratemyprofessors.com/professor/{id}
 */
public record AdminRmpProfessorRequestDTO(Integer legacyId) {
}
