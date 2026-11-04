package com.example.courseplanner.controller;

import com.example.courseplanner.entity.RmpLookup;
import com.example.courseplanner.entity.RmpSchool;
import com.example.courseplanner.exception.ForbiddenException;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.exception.RmpUnavailableException;
import com.example.courseplanner.model.rmp.RmpTeacherProfile;
import com.example.courseplanner.repository.RmpLookupRepository;
import com.example.courseplanner.repository.RmpMismatchReportRepository;
import com.example.courseplanner.repository.RmpMismatchReportRepository.OpenReportSummary;
import com.example.courseplanner.repository.RmpSchoolRepository;
import com.example.courseplanner.service.JwtService;
import com.example.courseplanner.service.RateMyProfessorsClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminRmpController.class)
@Import(GlobalExceptionHandler.class)
class AdminRmpControllerTest {

    private static final String AUTH_HEADER = "Bearer admin-token";
    private static final Instant NOW = Instant.parse("2026-11-04T18:00:00Z");
    private static final String BURNABY_ID = "U2Nob29sLTE0ODI=";
    private static final String GOMEZ_ID = "VGVhY2hlci0zMDMwMDEw"; // base64 of "Teacher-3030010"

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private RmpLookupRepository rmpLookupRepository;

    @MockBean
    private RmpMismatchReportRepository rmpMismatchReportRepository;

    @MockBean
    private RmpSchoolRepository rmpSchoolRepository;

    @MockBean
    private RateMyProfessorsClient rateMyProfessorsClient;

    @MockBean(name = "rmpClock")
    private Clock clock;

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(NOW);
        when(rmpSchoolRepository.findByActiveTrueOrderByLegacyIdAsc())
            .thenReturn(List.of(new RmpSchool(BURNABY_ID, 1482, "Simon Fraser University", 8, true)));
    }

    // ---------- list ----------

    @Test
    void listsLookupsWithOpenReportsInRepositoryOrder() throws Exception {
        when(rmpMismatchReportRepository.findOpenReportSummaries()).thenReturn(List.of(
            summary(12L, 3, "2026-11-01T10:00:00Z", "2026-11-03T09:30:00Z"),
            summary(7L, 1, "2026-11-02T08:00:00Z", "2026-11-02T08:00:00Z")));
        when(rmpLookupRepository.findAllById(List.of(12L, 7L))).thenReturn(List.of(
            noMatchLookup(7L, "Gomez Borquez, Claudia", "bus"),
            matchedLookup(12L, "Hall, Margaret", "als", 1436226, 0.82)));

        mockMvc.perform(get("/api/admin/rmp/reports").header("Authorization", AUTH_HEADER))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].lookupId").value(12))
            .andExpect(jsonPath("$[0].rawName").value("Hall, Margaret"))
            .andExpect(jsonPath("$[0].displayName").value("Margaret Hall"))
            .andExpect(jsonPath("$[0].deptCode").value("als"))
            .andExpect(jsonPath("$[0].status").value("MATCHED"))
            .andExpect(jsonPath("$[0].rmpLegacyId").value(1436226))
            .andExpect(jsonPath("$[0].profileUrl").value("https://www.ratemyprofessors.com/professor/1436226"))
            .andExpect(jsonPath("$[0].matchScore").value(0.82))
            .andExpect(jsonPath("$[0].openReports").value(3))
            .andExpect(jsonPath("$[0].firstReportedAt").value("2026-11-01T10:00:00Z"))
            .andExpect(jsonPath("$[0].lastReportedAt").value("2026-11-03T09:30:00Z"))
            .andExpect(jsonPath("$[1].lookupId").value(7))
            .andExpect(jsonPath("$[1].status").value("NO_MATCH"))
            .andExpect(jsonPath("$[1].profileUrl").value(nullValue()))
            .andExpect(jsonPath("$[1].rmpLegacyId").value(nullValue()));

        verify(jwtService).verifyAdmin(AUTH_HEADER);
    }

    @Test
    void emptyListWhenNothingIsOpen() throws Exception {
        when(rmpMismatchReportRepository.findOpenReportSummaries()).thenReturn(List.of());
        when(rmpLookupRepository.findAllById(List.of())).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/rmp/reports").header("Authorization", AUTH_HEADER))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void everyEndpointRequiresAnAdmin() throws Exception {
        doThrow(new ForbiddenException("Access denied: not an admin")).when(jwtService).verifyAdmin(AUTH_HEADER);

        mockMvc.perform(get("/api/admin/rmp/reports").header("Authorization", AUTH_HEADER))
            .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/rmp/reports/7/dismiss").header("Authorization", AUTH_HEADER))
            .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/rmp/reports/7/no-match").header("Authorization", AUTH_HEADER))
            .andExpect(status().isForbidden());
        setProfessor(7L, "{\"legacyId\": 3030010}").andExpect(status().isForbidden());

        verifyNoInteractions(rmpLookupRepository, rmpMismatchReportRepository, rateMyProfessorsClient);
    }

    // ---------- dismiss ----------

    @Test
    void dismissResolvesReportsAndLeavesTheLookupAlone() throws Exception {
        RmpLookup lookup = matchedLookup(12L, "Hall, Margaret", "als", 1436226, 0.82);
        when(rmpLookupRepository.findById(12L)).thenReturn(Optional.of(lookup));

        mockMvc.perform(patch("/api/admin/rmp/reports/12/dismiss").header("Authorization", AUTH_HEADER))
            .andExpect(status().isNoContent());

        verify(rmpMismatchReportRepository).resolveOpenReports(12L, NOW);
        verify(rmpLookupRepository, never()).save(any());
        assertEquals(1436226, lookup.getRmpLegacyId());
    }

    @Test
    void actionsOnAnUnknownLookupAre404() throws Exception {
        when(rmpLookupRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/admin/rmp/reports/99/dismiss").header("Authorization", AUTH_HEADER))
            .andExpect(status().isNotFound());
        mockMvc.perform(patch("/api/admin/rmp/reports/99/no-match").header("Authorization", AUTH_HEADER))
            .andExpect(status().isNotFound());
        setProfessor(99L, "{\"legacyId\": 3030010}").andExpect(status().isNotFound());

        verify(rmpMismatchReportRepository, never()).resolveOpenReports(anyLong(), any());
        verifyNoInteractions(rateMyProfessorsClient);
    }

    // ---------- no match ----------

    @Test
    void noMatchClearsTheProfessorAndResolvesReports() throws Exception {
        RmpLookup lookup = matchedLookup(12L, "Hall, Margaret", "als", 1436226, 0.82);
        when(rmpLookupRepository.findById(12L)).thenReturn(Optional.of(lookup));

        mockMvc.perform(patch("/api/admin/rmp/reports/12/no-match").header("Authorization", AUTH_HEADER))
            .andExpect(status().isNoContent());

        assertTrue(lookup.getNoMatch());
        assertNull(lookup.getRmpTeacherId());
        assertNull(lookup.getRmpLegacyId());
        assertNull(lookup.getMatchScore());
        assertEquals(NOW, lookup.getCheckedAt());
        verify(rmpLookupRepository).save(lookup);
        verify(rmpMismatchReportRepository).resolveOpenReports(12L, NOW);
    }

    // ---------- set professor ----------

    @Test
    void setProfessorFetchesTheProfileAndStoresIt() throws Exception {
        RmpLookup lookup = noMatchLookup(7L, "Gomez Borquez, Claudia", "bus");
        when(rmpLookupRepository.findById(7L)).thenReturn(Optional.of(lookup));
        when(rateMyProfessorsClient.getTeacherProfileStrict(GOMEZ_ID))
            .thenReturn(Optional.of(profile(GOMEZ_ID, 3030010, BURNABY_ID)));

        setProfessor(7L, "{\"legacyId\": 3030010}").andExpect(status().isNoContent());

        ArgumentCaptor<RmpLookup> saved = ArgumentCaptor.forClass(RmpLookup.class);
        verify(rmpLookupRepository).save(saved.capture());
        assertFalse(saved.getValue().getNoMatch());
        assertEquals(GOMEZ_ID, saved.getValue().getRmpTeacherId());
        assertEquals(3030010, saved.getValue().getRmpLegacyId());
        assertNull(saved.getValue().getMatchScore());
        assertEquals(NOW, saved.getValue().getCheckedAt());
        verify(rmpMismatchReportRepository).resolveOpenReports(7L, NOW);
    }

    @Test
    void setProfessorRejectsMissingOrInvalidIds() throws Exception {
        when(rmpLookupRepository.findById(7L)).thenReturn(Optional.of(noMatchLookup(7L, "Gomez Borquez, Claudia", "bus")));

        setProfessor(7L, "{}").andExpect(status().isBadRequest());
        setProfessor(7L, "{\"legacyId\": 0}").andExpect(status().isBadRequest());
        setProfessor(7L, "{\"legacyId\": -4}").andExpect(status().isBadRequest());

        verifyNoInteractions(rateMyProfessorsClient);
        verify(rmpMismatchReportRepository, never()).resolveOpenReports(anyLong(), any());
    }

    @Test
    void setProfessorIs404WhenRmpHasNoSuchProfessor() throws Exception {
        when(rmpLookupRepository.findById(7L)).thenReturn(Optional.of(noMatchLookup(7L, "Gomez Borquez, Claudia", "bus")));
        when(rateMyProfessorsClient.getTeacherProfileStrict(GOMEZ_ID)).thenReturn(Optional.empty());

        setProfessor(7L, "{\"legacyId\": 3030010}").andExpect(status().isNotFound());

        verify(rmpLookupRepository, never()).save(any());
        verify(rmpMismatchReportRepository, never()).resolveOpenReports(anyLong(), any());
    }

    @Test
    void setProfessorRejectsAProfessorAtAnotherSchool() throws Exception {
        when(rmpLookupRepository.findById(7L)).thenReturn(Optional.of(noMatchLookup(7L, "Gomez Borquez, Claudia", "bus")));
        when(rateMyProfessorsClient.getTeacherProfileStrict(GOMEZ_ID))
            .thenReturn(Optional.of(profile(GOMEZ_ID, 3030010, "U2Nob29sLTE0MTM=")));

        setProfessor(7L, "{\"legacyId\": 3030010}").andExpect(status().isBadRequest());

        verify(rmpLookupRepository, never()).save(any());
        verify(rmpMismatchReportRepository, never()).resolveOpenReports(anyLong(), any());
    }

    @Test
    void setProfessorIs503WhenRmpIsDown() throws Exception {
        when(rmpLookupRepository.findById(7L)).thenReturn(Optional.of(noMatchLookup(7L, "Gomez Borquez, Claudia", "bus")));
        when(rateMyProfessorsClient.getTeacherProfileStrict(GOMEZ_ID))
            .thenThrow(new RmpUnavailableException("RMP request failed"));

        setProfessor(7L, "{\"legacyId\": 3030010}").andExpect(status().isServiceUnavailable());

        verify(rmpLookupRepository, never()).save(any());
        verify(rmpMismatchReportRepository, never()).resolveOpenReports(anyLong(), any());
    }

    @Test
    void teacherIdIsBase64OfTheLegacyId() {
        assertEquals("VGVhY2hlci0xNDM2MjI2", AdminRmpController.teacherId(1436226));
        assertEquals(GOMEZ_ID, AdminRmpController.teacherId(3030010));
    }

    // ---------- helpers ----------

    private ResultActions setProfessor(Long lookupId, String body) throws Exception {
        return mockMvc.perform(patch("/api/admin/rmp/reports/" + lookupId + "/professor")
            .header("Authorization", AUTH_HEADER)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body));
    }

    private static RmpLookup matchedLookup(Long id, String rawName, String deptCode, int legacyId, double score) {
        RmpLookup lookup = new RmpLookup(rawName, rawName.toLowerCase(), deptCode);
        lookup.setLookupId(id);
        lookup.markMatched("teacher-" + legacyId, legacyId, score, Instant.parse("2026-10-01T00:00:00Z"));
        return lookup;
    }

    private static RmpLookup noMatchLookup(Long id, String rawName, String deptCode) {
        RmpLookup lookup = new RmpLookup(rawName, rawName.toLowerCase(), deptCode);
        lookup.setLookupId(id);
        lookup.markNoMatch(Instant.parse("2026-10-01T00:00:00Z"));
        return lookup;
    }

    private static RmpTeacherProfile profile(String teacherId, int legacyId, String schoolId) {
        return new RmpTeacherProfile(teacherId, legacyId, "Claudia", "Gomez", "Business",
            4.1, 2.9, 12, 80.0, schoolId, "Simon Fraser University", "Burnaby", "BC");
    }

    private static OpenReportSummary summary(Long lookupId, long count, String first, String last) {
        return new OpenReportSummary() {
            @Override public Long getLookupId() { return lookupId; }
            @Override public Long getOpenReports() { return count; }
            @Override public Instant getFirstReportedAt() { return Instant.parse(first); }
            @Override public Instant getLastReportedAt() { return Instant.parse(last); }
        };
    }
}
