package com.example.courseplanner.service;

import com.example.courseplanner.model.rmp.RmpSchoolSearchResult;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RateMyProfessorsClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private RestTemplate restTemplate;
    private RateMyProfessorsClient client;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        client = new RateMyProfessorsClient(restTemplate);
    }

    @Test
    void mapsAValidSchoolSearchAndUsesGraphQlVariables() throws Exception {
        JsonNode body = json("""
                {"data":{"newSearch":{"schools":{"edges":[{"node":{
                  "id":"U2Nob29sLTE0ODI=","legacyId":1482,"name":"Simon Fraser University",
                  "city":"Burnaby","state":"BC"
                }}]}}}}
                """);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        List<RmpSchoolSearchResult> schools = client.searchSchools("Simon Fraser University");

        assertEquals(1, schools.size());
        assertEquals("U2Nob29sLTE0ODI=", schools.get(0).rmpSchoolId());
        assertEquals(1482, schools.get(0).legacyId());
        assertEquals("Burnaby", schools.get(0).city());

        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), requestCaptor.capture(), eq(JsonNode.class));
        assertEquals("Basic dGVzdDp0ZXN0", requestCaptor.getValue().getHeaders().getFirst("Authorization"));
        Map<?, ?> payload = (Map<?, ?>) requestCaptor.getValue().getBody();
        Map<?, ?> variables = (Map<?, ?>) payload.get("variables");
        Map<?, ?> query = (Map<?, ?>) variables.get("query");
        assertEquals("Simon Fraser University", query.get("text"));
    }

    @Test
    void mapsAValidSchoolScopedTeacherSearch() throws Exception {
        JsonNode body = json("""
                {"data":{"newSearch":{"teachers":{"edges":[{"node":{
                  "id":"VGVhY2hlci0xMjM=","legacyId":123,"firstName":"Ada","lastName":"Lovelace",
                  "department":"Computing Science","avgRating":4.2,"avgDifficulty":3.1,
                  "numRatings":21,"wouldTakeAgainPercent":90,
                  "school":{"id":"U2Nob29sLTE0ODI=","name":"Simon Fraser University"}
                }}]}}}}
                """);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        List<RmpTeacherSearchResult> teachers = client.searchTeachers("Ada Lovelace", "U2Nob29sLTE0ODI=");

        assertEquals(1, teachers.size());
        assertEquals("VGVhY2hlci0xMjM=", teachers.get(0).rmpTeacherId());
        assertEquals(4.2, teachers.get(0).avgRating());
        assertEquals(90.0, teachers.get(0).wouldTakeAgainPercent());
        assertEquals("Simon Fraser University", teachers.get(0).schoolName());
    }

    @Test
    void mapsAValidTeacherProfile() throws Exception {
        JsonNode body = json("""
                {"data":{"node":{
                  "id":"VGVhY2hlci0xMjM=","legacyId":123,"firstName":"Ada","lastName":"Lovelace",
                  "department":"Computing Science","avgRating":4.2,"avgDifficulty":3.1,
                  "numRatings":21,"wouldTakeAgainPercent":90,
                  "school":{"id":"U2Nob29sLTE0ODI=","name":"Simon Fraser University","city":"Burnaby","state":"BC"}
                }}}
                """);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        Optional<RmpTeacherProfile> teacher = client.getTeacherProfile("VGVhY2hlci0xMjM=");

        assertTrue(teacher.isPresent());
        assertEquals(123, teacher.get().legacyId());
        assertEquals("BC", teacher.get().schoolState());
    }

    @Test
    void returnsEmptyResultsForInvalidInputAndProviderFailures() {
        assertTrue(client.searchSchools(" ").isEmpty());
        assertTrue(client.searchTeachers("Ada", " ").isEmpty());
        assertTrue(client.getTeacherProfile(" ").isEmpty());

        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenThrow(new RestClientException("RMP unavailable"));

        assertTrue(client.searchSchools("Simon Fraser University").isEmpty());
        assertTrue(client.searchTeachers("Ada Lovelace", "U2Nob29sLTE0ODI=").isEmpty());
        assertFalse(client.getTeacherProfile("VGVhY2hlci0xMjM=").isPresent());
    }

    @Test
    void returnsEmptyResultsForGraphQlErrorsAndMalformedBodies() throws Exception {
        JsonNode graphQlError = json("{\"data\":null,\"errors\":[{\"message\":\"schema changed\"}]}");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(new ResponseEntity<>(graphQlError, HttpStatus.OK));

        assertTrue(client.searchSchools("Simon Fraser University").isEmpty());

        JsonNode malformed = json("{\"data\":{\"newSearch\":{}}}");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(new ResponseEntity<>(malformed, HttpStatus.OK));

        assertTrue(client.searchTeachers("Ada Lovelace", "U2Nob29sLTE0ODI=").isEmpty());
    }

    private JsonNode json(String value) throws Exception {
        return objectMapper.readTree(value);
    }
}
