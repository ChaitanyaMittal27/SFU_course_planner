package com.example.courseplanner.controller;

import com.example.courseplanner.entity.Department;
import com.example.courseplanner.entity.RmpLookup;
import com.example.courseplanner.entity.RmpMismatchReport;
import com.example.courseplanner.entity.RmpSchool;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.exception.RmpUnavailableException;
import com.example.courseplanner.model.rmp.RmpTeacherProfile;
import com.example.courseplanner.model.rmp.RmpTeacherSearchResult;
import com.example.courseplanner.repository.DepartmentRepository;
import com.example.courseplanner.repository.RmpLookupRepository;
import com.example.courseplanner.repository.RmpMismatchReportRepository;
import com.example.courseplanner.repository.RmpSchoolRepository;
import com.example.courseplanner.service.RateMyProfessorsClient;
import com.example.courseplanner.service.RmpMatcher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RmpController.class)
@Import({GlobalExceptionHandler.class, RmpMatcher.class})
class RmpControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-03T20:00:00Z");
    private static final String HALL_ID = "VGVhY2hlci0xNDM2MjI2";
    private static final RmpSchool BURNABY = new RmpSchool("U2Nob29sLTE0ODI=", 1482, "Simon Fraser University", 8, true);
    private static final RmpSchool SURREY = new RmpSchool("U2Nob29sLTQyNjc=", 4267, "Simon Fraser University - Surrey", 5, true);

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RmpLookupRepository rmpLookupRepository;

    @MockBean
    private RmpSchoolRepository rmpSchoolRepository;

    @MockBean
    private RmpMismatchReportRepository rmpMismatchReportRepository;

    @MockBean
    private DepartmentRepository departmentRepository;

    @MockBean
    private RateMyProfessorsClient rateMyProfessorsClient;

    @MockBean(name = "rmpClock")
    private Clock clock;

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(NOW);
        when(departmentRepository.findByDeptCode("als")).thenReturn(Optional.of(department("als", "Criminology")));
        when(rmpSchoolRepository.findByActiveTrueOrderByLegacyIdAsc()).thenReturn(List.of(BURNABY, SURREY));
        when(rmpLookupRepository.saveAndFlush(any(RmpLookup.class))).thenAnswer(invocation -> {
            RmpLookup lookup = invocation.getArgument(0);
            if (lookup.getLookupId() == null) {
                lookup.setLookupId(7L);
            }
            return lookup;
        });
    }

    // ---------- first lookup ----------

    @Test
    void firstLookupSearchesAllSchoolsAndStoresTheMatch() throws Exception {
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("margaret hall", "als")).thenReturn(Optional.empty());
        when(rateMyProfessorsClient.searchTeachersAtSchools(List.of("margaret hall"), List.of(BURNABY, SURREY)))
            .thenReturn(List.of(
                result(HALL_ID, 1436226, "Margaret", "Hall", "Criminology"),
                result("other", 99, "Margaret", "Grant", "Linguistics")));

        lookup("Hall, Margaret", "als")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("MATCHED"))
            .andExpect(jsonPath("$.lookupId").value(7))
            .andExpect(jsonPath("$.searchName").value("Margaret Hall"))
            .andExpect(jsonPath("$.searchUrl").value("https://www.ratemyprofessors.com/search/professors/1482?q=Margaret%20Hall"))
            .andExpect(jsonPath("$.teacher.firstName").value("Margaret"))
            .andExpect(jsonPath("$.teacher.avgRating").value(4.0))
            .andExpect(jsonPath("$.teacher.matchScore").value(1.0))
            .andExpect(jsonPath("$.teacher.profileUrl").value("https://www.ratemyprofessors.com/professor/1436226"));

        RmpLookup saved = savedLookup();
        assertEquals("Hall, Margaret", saved.getRawName());
        assertEquals("margaret hall", saved.getCleanedName());
        assertEquals("als", saved.getDeptCode());
        assertEquals(HALL_ID, saved.getRmpTeacherId());
        assertEquals(1436226, saved.getRmpLegacyId());
        assertEquals(false, saved.getNoMatch());
        assertEquals(NOW, saved.getCheckedAt());
        verify(rateMyProfessorsClient, never()).getTeacherProfileStrict(anyString()); // ratings came with the search
    }

    @Test
    void firstLookupWithNobodyAboveThresholdStoresNoMatch() throws Exception {
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("karen yip", "als")).thenReturn(Optional.empty());
        when(rateMyProfessorsClient.searchTeachersAtSchools(anyList(), anyList()))
            .thenReturn(List.of(result("t", 1, "Karen", "Brown", "Criminal Justice")));

        lookup("Yip, Karen", "als")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("NO_MATCH"))
            .andExpect(jsonPath("$.lookupId").value(7))
            .andExpect(jsonPath("$.teacher").value(nullValue()))
            .andExpect(jsonPath("$.searchUrl", endsWith("q=Karen%20Yip")));

        RmpLookup saved = savedLookup();
        assertTrue(saved.getNoMatch());
        assertEquals(null, saved.getRmpTeacherId());
        assertEquals(NOW, saved.getCheckedAt());
    }

    @Test
    void searchesWithEveryNameVariant() throws Exception {
        when(departmentRepository.findByDeptCode("cmns")).thenReturn(Optional.of(department("cmns", "Communication")));
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("sarah ganzon", "cmns")).thenReturn(Optional.empty());
        when(rateMyProfessorsClient.searchTeachersAtSchools(anyList(), anyList())).thenReturn(List.of());

        lookup("Ganzon, Sarah Christina", "CMNS").andExpect(jsonPath("$.status").value("NO_MATCH"));

        verify(rateMyProfessorsClient).searchTeachersAtSchools(
            List.of("sarah christina ganzon", "sarah ganzon"), List.of(BURNABY, SURREY));
    }

    @Test
    void simultaneousFirstLookupsUpdateTheRowTheOtherCreated() throws Exception {
        RmpLookup created = lookupRow(11L, null, null, true, NOW);
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("margaret hall", "als"))
            .thenReturn(Optional.empty(), Optional.empty(), Optional.of(created));
        when(rateMyProfessorsClient.searchTeachersAtSchools(anyList(), anyList()))
            .thenReturn(List.of(result(HALL_ID, 1436226, "Margaret", "Hall", "Criminology")));
        when(rmpLookupRepository.saveAndFlush(any(RmpLookup.class)))
            .thenThrow(new DataIntegrityViolationException("duplicate key"))
            .thenAnswer(invocation -> invocation.getArgument(0));

        lookup("Hall, Margaret", "als")
            .andExpect(jsonPath("$.status").value("MATCHED"))
            .andExpect(jsonPath("$.lookupId").value(11));
        assertEquals(HALL_ID, created.getRmpTeacherId());
    }

    // ---------- stored rows ----------

    @Test
    void knownMatchMakesOneProfileRequestAndNoSearch() throws Exception {
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("margaret hall", "als"))
            .thenReturn(Optional.of(lookupRow(7L, HALL_ID, 1436226, false, NOW.minus(Duration.ofDays(90)))));
        when(rateMyProfessorsClient.getTeacherProfileStrict(HALL_ID)).thenReturn(Optional.of(profile(2.5)));

        lookup("Hall, Margaret", "als")
            .andExpect(jsonPath("$.status").value("MATCHED"))
            .andExpect(jsonPath("$.teacher.avgRating").value(2.5))
            .andExpect(jsonPath("$.teacher.matchScore").value(1.0));

        verify(rateMyProfessorsClient, times(1)).getTeacherProfileStrict(HALL_ID);
        verify(rateMyProfessorsClient, never()).searchTeachersAtSchools(anyList(), anyList());
        verify(rmpLookupRepository, never()).saveAndFlush(any());
    }

    @Test
    void recentNoMatchAnswersWithoutCallingRmp() throws Exception {
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("karen yip", "als"))
            .thenReturn(Optional.of(lookupRow(8L, null, null, true, NOW.minus(Duration.ofDays(6)))));

        lookup("Yip, Karen", "als")
            .andExpect(jsonPath("$.status").value("NO_MATCH"))
            .andExpect(jsonPath("$.lookupId").value(8));
        verifyNoInteractions(rateMyProfessorsClient);
    }

    @Test
    void noMatchOlderThanSevenDaysIsSearchedAgain() throws Exception {
        RmpLookup old = lookupRow(8L, null, null, true, NOW.minus(Duration.ofDays(8)));
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("karen yip", "als")).thenReturn(Optional.of(old));
        when(rateMyProfessorsClient.searchTeachersAtSchools(anyList(), anyList()))
            .thenReturn(List.of(result("new", 555, "Karen", "Yip", "Criminology")));

        lookup("Yip, Karen", "als")
            .andExpect(jsonPath("$.status").value("MATCHED"))
            .andExpect(jsonPath("$.lookupId").value(8));
        assertEquals("new", old.getRmpTeacherId());
        assertEquals(NOW, old.getCheckedAt());
    }

    @Test
    void deletedRmpProfileIsIdentifiedAgain() throws Exception {
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("margaret hall", "als"))
            .thenReturn(Optional.of(lookupRow(7L, HALL_ID, 1436226, false, NOW)));
        when(rateMyProfessorsClient.getTeacherProfileStrict(HALL_ID)).thenReturn(Optional.empty());
        when(rateMyProfessorsClient.searchTeachersAtSchools(anyList(), anyList())).thenReturn(List.of());

        lookup("Hall, Margaret", "als").andExpect(jsonPath("$.status").value("NO_MATCH"));
    }

    // ---------- failures store nothing ----------

    @Test
    void searchFailureStoresNothing() throws Exception {
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("margaret hall", "als")).thenReturn(Optional.empty());
        when(rateMyProfessorsClient.searchTeachersAtSchools(anyList(), anyList()))
            .thenThrow(new RmpUnavailableException("down"));

        lookup("Hall, Margaret", "als")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UNAVAILABLE"))
            .andExpect(jsonPath("$.lookupId").value(nullValue()))
            .andExpect(jsonPath("$.teacher").value(nullValue()))
            .andExpect(jsonPath("$.searchUrl", endsWith("q=Margaret%20Hall")));
        verify(rmpLookupRepository, never()).saveAndFlush(any());
    }

    @Test
    void profileFailureKeepsTheStoredMatch() throws Exception {
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("margaret hall", "als"))
            .thenReturn(Optional.of(lookupRow(7L, HALL_ID, 1436226, false, NOW)));
        when(rateMyProfessorsClient.getTeacherProfileStrict(HALL_ID)).thenThrow(new RmpUnavailableException("down"));

        lookup("Hall, Margaret", "als")
            .andExpect(jsonPath("$.status").value("UNAVAILABLE"))
            .andExpect(jsonPath("$.lookupId").value(7));
        verify(rmpLookupRepository, never()).saveAndFlush(any());
    }

    @Test
    void unexpectedClientErrorIsTreatedAsUnavailable() throws Exception {
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("margaret hall", "als"))
            .thenReturn(Optional.of(lookupRow(7L, HALL_ID, 1436226, false, NOW)));
        when(rateMyProfessorsClient.getTeacherProfileStrict(HALL_ID)).thenThrow(new IllegalStateException("parse bug"));

        lookup("Hall, Margaret", "als").andExpect(jsonPath("$.status").value("UNAVAILABLE"));
    }

    // ---------- validation ----------

    @Test
    void rejectsBadInputBeforeAnyDatabaseOrNetworkWork() throws Exception {
        for (String name : new String[] {" ", "TBA", "Staff", "Hall,", "123", "Hall, Margaret; Liu, Connie",
            "a\nb", "x".repeat(201)}) {
            lookup(name, "als").andExpect(status().isBadRequest());
        }
        lookup("Hall, Margaret", "../x").andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/rmp").param("deptCode", "als")).andExpect(status().is4xxClientError());
        verifyNoInteractions(rateMyProfessorsClient);
        verify(rmpLookupRepository, never()).findByCleanedNameAndDeptCode(anyString(), anyString());
    }

    @Test
    void unknownDepartmentIsNotFound() throws Exception {
        when(departmentRepository.findByDeptCode("zzzz")).thenReturn(Optional.empty());
        lookup("Hall, Margaret", "zzzz").andExpect(status().isNotFound());
    }

    @Test
    void htmlEncodedNamesAreDecoded() throws Exception {
        when(departmentRepository.findByDeptCode("crim")).thenReturn(Optional.of(department("crim", "Criminology")));
        when(rmpLookupRepository.findByCleanedNameAndDeptCode("tamara odoherty", "crim"))
            .thenReturn(Optional.of(lookupRow(3L, null, null, true, NOW)));

        lookup("O&#39;Doherty, Tamara", "crim").andExpect(jsonPath("$.searchName").value("Tamara O'Doherty"));
    }

    // ---------- reports ----------

    @Test
    void reportStoresTheTeacherShownAtTheTime() throws Exception {
        when(rmpLookupRepository.findById(7L)).thenReturn(Optional.of(lookupRow(7L, HALL_ID, 1436226, false, NOW)));
        when(rmpMismatchReportRepository.save(any(RmpMismatchReport.class))).thenAnswer(invocation -> {
            RmpMismatchReport report = invocation.getArgument(0);
            report.setReportId(42L);
            return report;
        });

        mockMvc.perform(post("/api/rmp/reports").contentType(MediaType.APPLICATION_JSON).content("{\"lookupId\":7}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.reportId").value(42));

        ArgumentCaptor<RmpMismatchReport> report = ArgumentCaptor.forClass(RmpMismatchReport.class);
        verify(rmpMismatchReportRepository).save(report.capture());
        assertEquals(7L, report.getValue().getLookupId());
        assertEquals(HALL_ID, report.getValue().getRmpTeacherId());
        assertEquals(NOW, report.getValue().getCreatedAt());
    }

    @Test
    void reportOnUnknownLookupIsNotFoundAndMissingIdIsBadRequest() throws Exception {
        when(rmpLookupRepository.findById(404L)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/rmp/reports").contentType(MediaType.APPLICATION_JSON).content("{\"lookupId\":404}"))
            .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/rmp/reports").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
        verify(rmpMismatchReportRepository, never()).save(any());
    }

    // ---------- helpers ----------

    private ResultActions lookup(String name, String deptCode) throws Exception {
        return mockMvc.perform(get("/api/rmp").param("name", name).param("deptCode", deptCode));
    }

    private RmpLookup savedLookup() {
        ArgumentCaptor<RmpLookup> saved = ArgumentCaptor.forClass(RmpLookup.class);
        verify(rmpLookupRepository).saveAndFlush(saved.capture());
        return saved.getValue();
    }

    private static Department department(String code, String rmpName) {
        Department department = new Department(code, code.toUpperCase());
        department.setRmpName(rmpName);
        return department;
    }

    private static RmpTeacherSearchResult result(String id, int legacyId, String first, String last, String dept) {
        return new RmpTeacherSearchResult(id, legacyId, first, last, dept, 4.0, 3.0, 10, 75.0,
            BURNABY.getRmpSchoolId(), BURNABY.getName());
    }

    private static RmpTeacherProfile profile(double rating) {
        return new RmpTeacherProfile(HALL_ID, 1436226, "Margaret", "Hall", "Criminology", rating, 3.1, 3, null,
            BURNABY.getRmpSchoolId(), BURNABY.getName(), "Burnaby", "BC");
    }

    private static RmpLookup lookupRow(Long id, String teacherId, Integer legacyId, boolean noMatch, Instant checkedAt) {
        RmpLookup lookup = new RmpLookup("Hall, Margaret", "margaret hall", "als");
        lookup.setLookupId(id);
        if (noMatch) {
            lookup.markNoMatch(checkedAt);
        } else {
            lookup.markMatched(teacherId, legacyId, 1.0, checkedAt);
        }
        return lookup;
    }
}
