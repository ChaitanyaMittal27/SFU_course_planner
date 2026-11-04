package com.example.courseplanner.service;

import com.example.courseplanner.entity.RmpSchool;
import com.example.courseplanner.exception.RmpUnavailableException;
import com.example.courseplanner.model.rmp.RmpTeacherProfile;
import com.example.courseplanner.model.rmp.RmpTeacherSearchResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Strict client methods used for matching: failures throw instead of looking like "no results". */
class RateMyProfessorsClientStrictTest {

    private static final String SCHOOL = "U2Nob29sLTE0ODI=";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private RestTemplate restTemplate;
    private RateMyProfessorsClient client;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        client = new RateMyProfessorsClient(restTemplate);
    }

    @Test
    void strictSearchSendsLimitAndDisablesFallback() throws Exception {
        respond("{\"data\":{\"newSearch\":{\"teachers\":{\"edges\":[]}}}}");

        assertTrue(client.searchTeachersStrict("Margaret Hall", SCHOOL, 5).isEmpty());

        ArgumentCaptor<HttpEntity> request = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), request.capture(), eq(JsonNode.class));
        Map<?, ?> variables = (Map<?, ?>) ((Map<?, ?>) request.getValue().getBody()).get("variables");
        assertEquals(5, variables.get("first"));
        Map<?, ?> query = (Map<?, ?>) variables.get("query");
        assertEquals(false, query.get("fallback"));
        assertEquals(SCHOOL, query.get("schoolID"));
        assertTrue(((String) ((Map<?, ?>) request.getValue().getBody()).get("query")).contains("first: $first"));
    }

    @Test
    void strictSearchNormalizesMissingStatistics() throws Exception {
        respond("""
                {"data":{"newSearch":{"teachers":{"edges":[
                  {"node":{"id":"T1","legacyId":1,"firstName":"New","lastName":"Prof","department":"Physics",
                   "avgRating":0,"avgDifficulty":0,"numRatings":0,"wouldTakeAgainPercent":-1,
                   "school":{"id":"U2Nob29sLTE0ODI=","name":"Simon Fraser University"}}},
                  {"node":{"id":"T2","legacyId":2,"firstName":"Old","lastName":"Prof","department":"Physics",
                   "avgRating":3.5,"avgDifficulty":2.5,"numRatings":12,"wouldTakeAgainPercent":-1,
                   "school":{"id":"U2Nob29sLTE0ODI=","name":"Simon Fraser University"}}}
                ]}}}}
                """);

        List<RmpTeacherSearchResult> results = client.searchTeachersStrict("Prof", SCHOOL, 8);

        assertNull(results.get(0).avgRating(), "0 ratings: average is no data, not 0.0");
        assertNull(results.get(0).avgDifficulty());
        assertNull(results.get(0).wouldTakeAgainPercent(), "-1 means no data");
        assertEquals(3.5, results.get(1).avgRating());
        assertNull(results.get(1).wouldTakeAgainPercent());
    }

    @Test
    void strictSearchThrowsOnNetworkFailure() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenThrow(new RestClientException("down"));
        assertThrows(RmpUnavailableException.class, () -> client.searchTeachersStrict("Ada", SCHOOL, 8));
    }

    @Test
    void strictSearchThrowsOnGraphQlErrorsAndMalformedResponses() throws Exception {
        respond("{\"data\":null,\"errors\":[{\"message\":\"schema changed\"}]}");
        assertThrows(RmpUnavailableException.class, () -> client.searchTeachersStrict("Ada", SCHOOL, 8));

        respond("{\"data\":{\"newSearch\":{}}}");
        assertThrows(RmpUnavailableException.class, () -> client.searchTeachersStrict("Ada", SCHOOL, 8));

        respond("{\"data\":{\"newSearch\":{\"teachers\":{\"edges\":[{\"node\":{\"id\":\"T1\"}}]}}}}");
        assertThrows(RmpUnavailableException.class, () -> client.searchTeachersStrict("Ada", SCHOOL, 8));
    }

    @Test
    void strictSearchRejectsBadArguments() {
        assertThrows(IllegalArgumentException.class, () -> client.searchTeachersStrict(" ", SCHOOL, 8));
        assertThrows(IllegalArgumentException.class, () -> client.searchTeachersStrict("Ada", " ", 8));
        assertThrows(IllegalArgumentException.class, () -> client.searchTeachersStrict("Ada", SCHOOL, 0));
    }

    @Test
    void strictProfileReturnsNormalizedTeacher() throws Exception {
        respond("""
                {"data":{"node":{"id":"T1","legacyId":1436226,"firstName":"Margaret","lastName":"Hall",
                  "department":"Criminology","avgRating":2,"avgDifficulty":3.1,"numRatings":3,
                  "wouldTakeAgainPercent":-1,
                  "school":{"id":"U2Nob29sLTE0ODI=","name":"Simon Fraser University","city":"Burnaby","state":"BC"}}}}
                """);

        RmpTeacherProfile teacher = client.getTeacherProfileStrict("T1").orElseThrow();

        assertEquals(1436226, teacher.legacyId());
        assertEquals(2.0, teacher.avgRating());
        assertNull(teacher.wouldTakeAgainPercent());
    }

    @Test
    void strictProfileIsEmptyOnlyWhenRmpHasNoSuchTeacher() throws Exception {
        respond("{\"data\":{\"node\":null}}");
        assertEquals(Optional.empty(), client.getTeacherProfileStrict("gone"));

        respond("{\"data\":{\"node\":{\"id\":\"T1\"}}}");
        assertThrows(RmpUnavailableException.class, () -> client.getTeacherProfileStrict("T1"));

        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(new ResponseEntity<>(null, HttpStatus.BAD_GATEWAY));
        assertThrows(RmpUnavailableException.class, () -> client.getTeacherProfileStrict("T1"));
    }

    @Test
    void lenientSearchStillUsesEightResultsAndFallback() throws Exception {
        respond("{\"data\":{\"newSearch\":{\"teachers\":{\"edges\":[]}}}}");

        client.searchTeachers("Ada", SCHOOL);

        ArgumentCaptor<HttpEntity> request = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), request.capture(), eq(JsonNode.class));
        Map<?, ?> variables = (Map<?, ?>) ((Map<?, ?>) request.getValue().getBody()).get("variables");
        assertEquals(8, variables.get("first"));
        assertEquals(true, ((Map<?, ?>) variables.get("query")).get("fallback"));
    }

    // ---------- all SFU schools at once ----------

    private static final RmpSchool BURNABY = new RmpSchool(SCHOOL, 1482, "Simon Fraser University", 8, true);
    private static final RmpSchool SURREY = new RmpSchool("U2Nob29sLTQyNjc=", 4267, "Simon Fraser University - Surrey", 5, true);

    @Test
    void searchesEverySchoolForEveryNameInParallelAndMergesResults() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(4);
        try {
            client = new RateMyProfessorsClient(restTemplate, executor);
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                    .thenAnswer(invocation -> {
                        Map<?, ?> variables = (Map<?, ?>) ((Map<?, ?>) ((HttpEntity<?>) invocation.getArgument(2))
                                .getBody()).get("variables");
                        String school = (String) ((Map<?, ?>) variables.get("query")).get("schoolID");
                        // The same teacher appears in two searches; one result is from another university.
                        return new ResponseEntity<>(objectMapper.readTree("""
                                {"data":{"newSearch":{"teachers":{"edges":[
                                  {"node":{"id":"T1","legacyId":1,"firstName":"Sarah","lastName":"Ganzon","department":"Communication",
                                   "numRatings":27,"avgRating":2.2,"school":{"id":"%s","name":"x"}}},
                                  {"node":{"id":"OUT","legacyId":2,"firstName":"Sarah","lastName":"Ganzon","department":"Communication",
                                   "numRatings":1,"school":{"id":"U2Nob29sLTk5OTk=","name":"Elsewhere"}}}
                                ]}}}}
                                """.formatted(SCHOOL.equals(school) ? SCHOOL : "T1-school-" + school)), HttpStatus.OK);
                    });

            List<RmpTeacherSearchResult> results = client.searchTeachersAtSchools(
                    List.of("sarah christina ganzon", "sarah ganzon"), List.of(BURNABY, SURREY));

            assertEquals(1, results.size(), "deduplicated, outside schools dropped");
            assertEquals("T1", results.get(0).rmpTeacherId());
            // 2 names × 2 schools, each with that school's limit.
            verify(restTemplate, times(2)).exchange(anyString(), eq(HttpMethod.POST),
                    argThat(e -> firstOf(e) == 8), eq(JsonNode.class));
            verify(restTemplate, times(2)).exchange(anyString(), eq(HttpMethod.POST),
                    argThat(e -> firstOf(e) == 5), eq(JsonNode.class));
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void oneFailingSchoolMakesTheWholeSearchUnavailable() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            client = new RateMyProfessorsClient(restTemplate, executor);
            JsonNode ok = objectMapper.readTree("{\"data\":{\"newSearch\":{\"teachers\":{\"edges\":[]}}}}");
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                    .thenReturn(new ResponseEntity<>(ok, HttpStatus.OK))
                    .thenThrow(new RestClientException("down"));

            assertThrows(RmpUnavailableException.class, () -> client.searchTeachersAtSchools(
                    List.of("margaret hall"), List.of(BURNABY, SURREY)));
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void withoutAnExecutorSchoolsAreSearchedOneByOne() throws Exception {
        respond("{\"data\":{\"newSearch\":{\"teachers\":{\"edges\":[]}}}}");
        assertTrue(client.searchTeachersAtSchools(List.of("margaret hall"), List.of(BURNABY, SURREY)).isEmpty());
        verify(restTemplate, times(2)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class));
        assertThrows(IllegalArgumentException.class, () -> client.searchTeachersAtSchools(List.of(), List.of(BURNABY)));
    }

    private static int firstOf(HttpEntity<?> entity) {
        Object first = ((Map<?, ?>) ((Map<?, ?>) entity.getBody()).get("variables")).get("first");
        return first instanceof Integer value ? value : -1;
    }

    private void respond(String json) throws Exception {
        JsonNode body = objectMapper.readTree(json);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));
    }
}
