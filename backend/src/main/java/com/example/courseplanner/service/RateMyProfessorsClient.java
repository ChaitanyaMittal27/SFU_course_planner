package com.example.courseplanner.service;

import com.example.courseplanner.model.rmp.RmpSchoolSearchResult;
import com.example.courseplanner.model.rmp.RmpTeacherProfile;
import com.example.courseplanner.model.rmp.RmpTeacherSearchResult;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Low-level client for Rate My Professors' GraphQL endpoint.
 *
 * It translates provider responses into internal models and fails closed with
 * empty results.
 *
 * Intended flow:
 * 1. Search schools
 * 2. Search teachers at an RMP school
 * 3. Fetch teacher profile by RMP ID
 * 4. Exit
 *
 */
@Service
public class RateMyProfessorsClient {

    private static final String RMP_GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql";
    private static final String RMP_AUTHORIZATION = "Basic dGVzdDp0ZXN0";

    private static final String SCHOOL_SEARCH_QUERY = """
            query NewSearchSchoolsQuery($query: SchoolSearchQuery!) {
              newSearch {
                schools(query: $query) {
                  edges {
                    node { id legacyId name city state }
                  }
                }
              }
            }
            """;

    private static final String TEACHER_SEARCH_QUERY = """
            query TeacherSearchResultsPageQuery($query: TeacherSearchQuery!) {
              newSearch {
                teachers(query: $query, first: 8, after: "") {
                  edges {
                    node {
                      id legacyId firstName lastName department avgRating
                      avgDifficulty numRatings wouldTakeAgainPercent
                      school { id name }
                    }
                  }
                }
              }
            }
            """;

    private static final String TEACHER_PROFILE_QUERY = """
            query TeacherRatingsPageQuery($id: ID!) {
              node(id: $id) {
                ... on Teacher {
                  id legacyId firstName lastName department avgRating
                  avgDifficulty numRatings wouldTakeAgainPercent
                  school { id name city state }
                }
              }
            }
            """;

    private final RestTemplate restTemplate;

    public RateMyProfessorsClient(
            @Qualifier("rateMyProfessorsRestTemplate") RestTemplate restTemplate
    ) {
        this.restTemplate = restTemplate;
    }

    public List<RmpSchoolSearchResult> searchSchools(String schoolName) {
        if (schoolName == null || schoolName.isBlank()) {
            return List.of();
        }

        JsonNode body = execute(SCHOOL_SEARCH_QUERY, Map.of(
                "query", Map.of("text", schoolName.trim())
        ));
        if (body == null) {
            return List.of();
        }

        List<RmpSchoolSearchResult> results = new ArrayList<>();
        for (JsonNode edge : body.path("data").path("newSearch").path("schools").path("edges")) {
            JsonNode school = edge.path("node");
            String schoolId = textValue(school, "id");
            String name = textValue(school, "name");
            if (schoolId == null || name == null) {
                continue;
            }

            results.add(new RmpSchoolSearchResult(
                    schoolId,
                    integerValue(school, "legacyId"),
                    name,
                    textValue(school, "city"),
                    textValue(school, "state")
            ));
        }
        return results;
    }

    public List<RmpTeacherSearchResult> searchTeachers(String teacherName, String rmpSchoolId) {
        if (teacherName == null || teacherName.isBlank() || rmpSchoolId == null || rmpSchoolId.isBlank()) {
            return List.of();
        }

        Map<String, Object> teacherQuery = new HashMap<>();
        teacherQuery.put("text", teacherName.trim());
        teacherQuery.put("schoolID", rmpSchoolId);
        teacherQuery.put("fallback", true);
        teacherQuery.put("departmentID", null);

        JsonNode body = execute(TEACHER_SEARCH_QUERY, Map.of("query", teacherQuery));
        if (body == null) {
            return List.of();
        }

        List<RmpTeacherSearchResult> results = new ArrayList<>();
        for (JsonNode edge : body.path("data").path("newSearch").path("teachers").path("edges")) {
            JsonNode teacher = edge.path("node");
            String teacherId = textValue(teacher, "id");
            String firstName = textValue(teacher, "firstName");
            String lastName = textValue(teacher, "lastName");
            if (teacherId == null || firstName == null || lastName == null) {
                continue;
            }

            JsonNode school = teacher.path("school");
            results.add(new RmpTeacherSearchResult(
                    teacherId,
                    integerValue(teacher, "legacyId"),
                    firstName,
                    lastName,
                    textValue(teacher, "department"),
                    doubleValue(teacher, "avgRating"),
                    doubleValue(teacher, "avgDifficulty"),
                    integerValue(teacher, "numRatings"),
                    doubleValue(teacher, "wouldTakeAgainPercent"),
                    textValue(school, "id"),
                    textValue(school, "name")
            ));
        }
        return results;
    }

    public Optional<RmpTeacherProfile> getTeacherProfile(String rmpTeacherId) {
        if (rmpTeacherId == null || rmpTeacherId.isBlank()) {
            return Optional.empty();
        }

        JsonNode body = execute(TEACHER_PROFILE_QUERY, Map.of("id", rmpTeacherId));
        if (body == null) {
            return Optional.empty();
        }

        JsonNode teacher = body.path("data").path("node");
        String teacherId = textValue(teacher, "id");
        String firstName = textValue(teacher, "firstName");
        String lastName = textValue(teacher, "lastName");
        if (teacherId == null || firstName == null || lastName == null) {
            return Optional.empty();
        }

        JsonNode school = teacher.path("school");
        return Optional.of(new RmpTeacherProfile(
                teacherId,
                integerValue(teacher, "legacyId"),
                firstName,
                lastName,
                textValue(teacher, "department"),
                doubleValue(teacher, "avgRating"),
                doubleValue(teacher, "avgDifficulty"),
                integerValue(teacher, "numRatings"),
                doubleValue(teacher, "wouldTakeAgainPercent"),
                textValue(school, "id"),
                textValue(school, "name"),
                textValue(school, "city"),
                textValue(school, "state")
        ));
    }

    private JsonNode execute(String query, Map<String, Object> variables) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, RMP_AUTHORIZATION);
        headers.set(HttpHeaders.CONTENT_TYPE, "application/json");

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    RMP_GRAPHQL_URL,
                    HttpMethod.POST,
                    new HttpEntity<>(Map.of("query", query, "variables", variables), headers),
                    JsonNode.class
            );
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null || response.getBody().has("errors")) {
                return null;
            }
            return response.getBody();
        } catch (RestClientException exception) {
            return null;
        }
    }

    private String textValue(JsonNode node, String fieldName) {
        JsonNode field = node.path(fieldName);
        return field.isTextual() && !field.asText().isBlank() ? field.asText() : null;
    }

    private Integer integerValue(JsonNode node, String fieldName) {
        JsonNode field = node.path(fieldName);
        return field.isIntegralNumber() ? field.intValue() : null;
    }

    private Double doubleValue(JsonNode node, String fieldName) {
        JsonNode field = node.path(fieldName);
        return field.isNumber() ? field.doubleValue() : null;
    }
}
