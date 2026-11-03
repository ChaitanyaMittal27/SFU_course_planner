package com.example.courseplanner.controller;

import com.example.courseplanner.entity.RmpSchool;
import com.example.courseplanner.model.rmp.RmpTeacherProfile;
import com.example.courseplanner.model.rmp.RmpTeacherSearchResult;
import com.example.courseplanner.repository.RmpTestDatabase;
import com.example.courseplanner.service.EmailTransport;
import com.example.courseplanner.service.RateMyProfessorsClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Boots the whole application against a real, migrated local Postgres (so JPA schema
 * validation runs too), with only RMP and email mocked. Opt-in: see {@link RmpTestDatabase}.
 * Rows it creates use a "Zztest" surname and are deleted afterwards.
 */
@EnabledIfEnvironmentVariable(named = RmpTestDatabase.URL_VARIABLE, matches = ".+")
@SpringBootTest(properties = {
        "supabase.project.url=http://127.0.0.1:1",
        "supabase.anon.key=test",
        "RESEND_API_KEY=test"
})
@AutoConfigureMockMvc
class RmpEndToEndDatabaseTest {

    private static final String SCHOOL = "U2Nob29sLTE0ODI=";

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", RmpTestDatabase::url);
        registry.add("spring.datasource.username", RmpTestDatabase::user);
        registry.add("spring.datasource.password", RmpTestDatabase::password);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    @MockBean
    private RateMyProfessorsClient client;

    @MockBean
    private EmailTransport emailTransport;

    @AfterEach
    void cleanUp() {
        jdbc.update("delete from public.rmp_lookup where cleaned_name like '% zztest'");
    }

    @Test
    void firstLookupSearchesThenLaterLookupsFetchByIdAndReportsAreStored() throws Exception {
        when(client.searchTeachersAtSchools(anyList(), anyList())).thenReturn(List.of(
                new RmpTeacherSearchResult("TZZ", 424242, "Ada", "Zztest", "Computer Science",
                        4.5, 2.0, 30, 90.0, SCHOOL, "Simon Fraser University")));

        // 1st request: searches RMP and stores the match.
        mockMvc.perform(get("/api/rmp").param("name", "Zztest, Ada").param("deptCode", "CMPT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MATCHED"))
                .andExpect(jsonPath("$.teacher.avgRating").value(4.5))
                .andExpect(jsonPath("$.teacher.profileUrl").value("https://www.ratemyprofessors.com/professor/424242"));
        Long lookupId = jdbc.queryForObject(
                "select lookup_id from public.rmp_lookup where cleaned_name = 'ada zztest' and dept_code = 'cmpt'",
                Long.class);

        // 2nd request: one live profile request, no search.
        reset(client);
        when(client.getTeacherProfileStrict("TZZ")).thenReturn(Optional.of(new RmpTeacherProfile(
                "TZZ", 424242, "Ada", "Zztest", "Computer Science", 4.6, 2.0, 31, 90.0,
                SCHOOL, "Simon Fraser University", "Burnaby", "BC")));
        mockMvc.perform(get("/api/rmp").param("name", "Zztest, Ada").param("deptCode", "cmpt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MATCHED"))
                .andExpect(jsonPath("$.lookupId").value(lookupId))
                .andExpect(jsonPath("$.teacher.avgRating").value(4.6));
        verify(client, times(1)).getTeacherProfileStrict("TZZ");
        verify(client, never()).searchTeachersAtSchools(anyList(), anyList());

        // Report the match.
        mockMvc.perform(post("/api/rmp/reports").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lookupId\":" + lookupId + "}"))
                .andExpect(status().isCreated());
        assertEquals("TZZ", jdbc.queryForObject(
                "select rmp_teacher_id from public.rmp_mismatch_reports where lookup_id = ?", String.class, lookupId));
    }

    @Test
    void noMatchIsStoredAndNotSearchedAgainWithinAWeek() throws Exception {
        when(client.searchTeachersAtSchools(anyList(), anyList())).thenReturn(List.of());

        mockMvc.perform(get("/api/rmp").param("name", "Zztest, Nobody").param("deptCode", "cmpt"))
                .andExpect(jsonPath("$.status").value("NO_MATCH"));
        reset(client);
        mockMvc.perform(get("/api/rmp").param("name", "Zztest, Nobody").param("deptCode", "cmpt"))
                .andExpect(jsonPath("$.status").value("NO_MATCH"));
        verify(client, never()).searchTeachersAtSchools(anyList(), anyList());
    }

    @Test
    void searchUsesTheSeededActiveSchoolsWithTheirLimits() throws Exception {
        when(client.searchTeachersAtSchools(anyList(), anyList())).thenReturn(List.of());

        mockMvc.perform(get("/api/rmp").param("name", "Zztest, Nobody").param("deptCode", "cmpt"));

        org.mockito.ArgumentCaptor<List<RmpSchool>> schools = org.mockito.ArgumentCaptor.forClass(List.class);
        verify(client).searchTeachersAtSchools(org.mockito.ArgumentMatchers.eq(List.of("nobody zztest")), schools.capture());
        assertEquals(List.of(1482, 4267, 5788, 14977), schools.getValue().stream().map(RmpSchool::getLegacyId).toList());
        assertEquals(8, schools.getValue().get(0).getSearchLimit());
    }

    @Test
    void sameNameInAnotherDepartmentIsSeparateAndReportsCascadeWithTheLookup() throws Exception {
        when(client.searchTeachersAtSchools(anyList(), anyList())).thenReturn(List.of(
                new RmpTeacherSearchResult("TZZ", 424242, "Ada", "Zztest", "Computer Science",
                        4.5, 2.0, 30, 90.0, SCHOOL, "Simon Fraser University")));

        mockMvc.perform(get("/api/rmp").param("name", "Zztest, Ada").param("deptCode", "cmpt"))
                .andExpect(jsonPath("$.status").value("MATCHED"));
        mockMvc.perform(get("/api/rmp").param("name", "Zztest, Ada").param("deptCode", "macm"))
                .andExpect(jsonPath("$.status").value("MATCHED"));
        assertEquals(2, jdbc.queryForObject(
                "select count(distinct lookup_id) from public.rmp_lookup where cleaned_name = 'ada zztest'", Integer.class));

        Long lookupId = jdbc.queryForObject(
                "select lookup_id from public.rmp_lookup where cleaned_name = 'ada zztest' and dept_code = 'macm'", Long.class);
        mockMvc.perform(post("/api/rmp/reports").contentType(MediaType.APPLICATION_JSON)
                .content("{\"lookupId\":" + lookupId + "}")).andExpect(status().isCreated());
        jdbc.update("delete from public.rmp_lookup where lookup_id = ?", lookupId);
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from public.rmp_mismatch_reports where lookup_id = ?", Integer.class, lookupId));
    }

    @Test
    void unknownDepartmentIs404() throws Exception {
        mockMvc.perform(get("/api/rmp").param("name", "Zztest, Ada").param("deptCode", "zzzz"))
                .andExpect(status().isNotFound());
    }
}
