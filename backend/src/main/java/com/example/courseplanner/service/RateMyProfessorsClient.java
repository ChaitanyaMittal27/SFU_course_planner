package com.example.courseplanner.service;

import com.example.courseplanner.entity.RmpSchool;
import com.example.courseplanner.exception.RmpUnavailableException;
import com.example.courseplanner.model.rmp.RmpSchoolSearchResult;
import com.example.courseplanner.model.rmp.RmpTeacherProfile;
import com.example.courseplanner.model.rmp.RmpTeacherSearchResult;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

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
 * The lenient methods return empty results on any failure. The strict methods (used for
 * matching) throw {@link RmpUnavailableException} instead, so an outage is never mistaken
 * for "no professor found".
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
            query TeacherSearchResultsPageQuery($query: TeacherSearchQuery!, $first: Int!) {
              newSearch {
                teachers(query: $query, first: $first, after: "") {
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

    /** Overall time allowed for searching every SFU school. */
    static final Duration SCHOOL_SEARCH_TIMEOUT = Duration.ofSeconds(10);

    private final RestTemplate restTemplate;
    private final ExecutorService searchExecutor;

    @Autowired
    public RateMyProfessorsClient(
            @Qualifier("rateMyProfessorsRestTemplate") RestTemplate restTemplate,
            @Qualifier("rmpSearchExecutor") ExecutorService searchExecutor
    ) {
        this.restTemplate = restTemplate;
        this.searchExecutor = searchExecutor;
    }

    /** For tests and the manual runner: multi-school searches then run one after another. */
    public RateMyProfessorsClient(RestTemplate restTemplate) {
        this(restTemplate, null);
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

    /** Default number of results per teacher search (the provider's original page size). */
    public static final int DEFAULT_SEARCH_LIMIT = 8;

    public List<RmpTeacherSearchResult> searchTeachers(String teacherName, String rmpSchoolId) {
        if (teacherName == null || teacherName.isBlank() || rmpSchoolId == null || rmpSchoolId.isBlank()) {
            return List.of();
        }
        JsonNode body = execute(TEACHER_SEARCH_QUERY,
                teacherSearchVariables(teacherName, rmpSchoolId, true, DEFAULT_SEARCH_LIMIT), false);
        return body == null ? List.of() : parseTeachers(body, false);
    }

    /**
     * School-scoped teacher search for matching. Unlike {@link #searchTeachers}, provider
     * failures and malformed responses throw {@link RmpUnavailableException} instead of
     * returning an empty list, and RMP's cross-school fallback is disabled.
     *
     * @param limit maximum results to return (the school's search_limit)
     */
    public List<RmpTeacherSearchResult> searchTeachersStrict(String teacherName, String rmpSchoolId, int limit) {
        if (teacherName == null || teacherName.isBlank() || rmpSchoolId == null || rmpSchoolId.isBlank()) {
            throw new IllegalArgumentException("Teacher name and school ID are required");
        }
        if (limit < 1) {
            throw new IllegalArgumentException("Search limit must be positive");
        }
        JsonNode body = execute(TEACHER_SEARCH_QUERY,
                teacherSearchVariables(teacherName, rmpSchoolId, false, limit), true);
        return parseTeachers(body, true);
    }

    /**
     * Searches every given school for every given name, in parallel, using each school's
     * {@code searchLimit}. Results from schools outside the list are dropped and duplicates
     * are merged by RMP ID (first occurrence kept).
     *
     * Strict: if any single search fails or the overall timeout passes, the whole call throws
     * {@link RmpUnavailableException}, so a partial candidate list never reaches matching.
     */
    public List<RmpTeacherSearchResult> searchTeachersAtSchools(List<String> names, List<RmpSchool> schools) {
        if (names == null || names.isEmpty() || schools == null || schools.isEmpty()) {
            throw new IllegalArgumentException("At least one name and one school are required");
        }
        List<Callable<List<RmpTeacherSearchResult>>> searches = new ArrayList<>();
        for (RmpSchool school : schools) {
            for (String name : names) {
                searches.add(() -> searchTeachersStrict(name, school.getRmpSchoolId(), school.getSearchLimit()));
            }
        }

        Set<String> allowedSchools = schools.stream().map(RmpSchool::getRmpSchoolId).collect(Collectors.toSet());
        Map<String, RmpTeacherSearchResult> merged = new LinkedHashMap<>();
        for (List<RmpTeacherSearchResult> results : runAll(searches)) {
            for (RmpTeacherSearchResult result : results) {
                if (allowedSchools.contains(result.rmpSchoolId())) {
                    merged.putIfAbsent(result.rmpTeacherId(), result);
                }
            }
        }
        return new ArrayList<>(merged.values());
    }

    private List<List<RmpTeacherSearchResult>> runAll(List<Callable<List<RmpTeacherSearchResult>>> searches) {
        if (searchExecutor == null) {
            List<List<RmpTeacherSearchResult>> results = new ArrayList<>();
            for (Callable<List<RmpTeacherSearchResult>> search : searches) {
                try {
                    results.add(search.call());
                } catch (RmpUnavailableException exception) {
                    throw exception;
                } catch (Exception exception) {
                    throw new RmpUnavailableException("RMP search failed", exception);
                }
            }
            return results;
        }

        List<Future<List<RmpTeacherSearchResult>>> futures;
        try {
            futures = searchExecutor.invokeAll(searches, SCHOOL_SEARCH_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new RmpUnavailableException("RMP search interrupted", exception);
        }
        List<List<RmpTeacherSearchResult>> results = new ArrayList<>();
        for (Future<List<RmpTeacherSearchResult>> future : futures) {
            try {
                results.add(future.get());
            } catch (CancellationException exception) {
                throw new RmpUnavailableException("RMP search timed out");
            } catch (ExecutionException exception) {
                if (exception.getCause() instanceof RmpUnavailableException unavailable) {
                    throw unavailable;
                }
                throw new RmpUnavailableException("RMP search failed", exception.getCause());
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new RmpUnavailableException("RMP search interrupted", exception);
            }
        }
        return results;
    }

    public Optional<RmpTeacherProfile> getTeacherProfile(String rmpTeacherId) {
        if (rmpTeacherId == null || rmpTeacherId.isBlank()) {
            return Optional.empty();
        }
        JsonNode body = execute(TEACHER_PROFILE_QUERY, Map.of("id", rmpTeacherId), false);
        return body == null ? Optional.empty() : parseProfile(body, false);
    }

    /**
     * Profile lookup by RMP ID for live ratings. Provider failures and malformed profiles
     * throw {@link RmpUnavailableException}. Returns empty only when RMP reports that no
     * teacher exists for this ID.
     */
    public Optional<RmpTeacherProfile> getTeacherProfileStrict(String rmpTeacherId) {
        if (rmpTeacherId == null || rmpTeacherId.isBlank()) {
            throw new IllegalArgumentException("RMP teacher ID is required");
        }
        JsonNode body = execute(TEACHER_PROFILE_QUERY, Map.of("id", rmpTeacherId), true);
        return parseProfile(body, true);
    }

    private Map<String, Object> teacherSearchVariables(
            String teacherName, String rmpSchoolId, boolean fallback, int limit) {
        Map<String, Object> teacherQuery = new HashMap<>();
        teacherQuery.put("text", teacherName.trim());
        teacherQuery.put("schoolID", rmpSchoolId);
        teacherQuery.put("fallback", fallback);
        teacherQuery.put("departmentID", null);
        return Map.of("query", teacherQuery, "first", limit);
    }

    private List<RmpTeacherSearchResult> parseTeachers(JsonNode body, boolean strict) {
        JsonNode edges = body.path("data").path("newSearch").path("teachers").path("edges");
        if (strict && !edges.isArray()) {
            throw new RmpUnavailableException("RMP teacher search returned an unexpected response");
        }
        List<RmpTeacherSearchResult> results = new ArrayList<>();
        for (JsonNode edge : edges) {
            JsonNode teacher = edge.path("node");
            String teacherId = textValue(teacher, "id");
            String firstName = textValue(teacher, "firstName");
            String lastName = textValue(teacher, "lastName");
            JsonNode school = teacher.path("school");
            if (teacherId == null || firstName == null || lastName == null
                    || (strict && textValue(school, "id") == null)) {
                if (strict) {
                    throw new RmpUnavailableException("RMP teacher search returned an incomplete teacher");
                }
                continue;
            }

            Integer numRatings = integerValue(teacher, "numRatings");
            results.add(new RmpTeacherSearchResult(
                    teacherId,
                    integerValue(teacher, "legacyId"),
                    firstName,
                    lastName,
                    textValue(teacher, "department"),
                    average(doubleValue(teacher, "avgRating"), numRatings),
                    average(doubleValue(teacher, "avgDifficulty"), numRatings),
                    numRatings,
                    percentage(doubleValue(teacher, "wouldTakeAgainPercent")),
                    textValue(school, "id"),
                    textValue(school, "name")
            ));
        }
        return results;
    }

    private Optional<RmpTeacherProfile> parseProfile(JsonNode body, boolean strict) {
        JsonNode teacher = body.path("data").path("node");
        if (teacher.isNull() || teacher.isMissingNode()) {
            return Optional.empty();
        }
        String teacherId = textValue(teacher, "id");
        String firstName = textValue(teacher, "firstName");
        String lastName = textValue(teacher, "lastName");
        if (teacherId == null || firstName == null || lastName == null) {
            if (strict) {
                throw new RmpUnavailableException("RMP returned an incomplete teacher profile");
            }
            return Optional.empty();
        }

        JsonNode school = teacher.path("school");
        Integer numRatings = integerValue(teacher, "numRatings");
        return Optional.of(new RmpTeacherProfile(
                teacherId,
                integerValue(teacher, "legacyId"),
                firstName,
                lastName,
                textValue(teacher, "department"),
                average(doubleValue(teacher, "avgRating"), numRatings),
                average(doubleValue(teacher, "avgDifficulty"), numRatings),
                numRatings,
                percentage(doubleValue(teacher, "wouldTakeAgainPercent")),
                textValue(school, "id"),
                textValue(school, "name"),
                textValue(school, "city"),
                textValue(school, "state")
        ));
    }

    /** RMP reports 0.0 averages for teachers with no ratings; that is "no data", not a score. */
    private static Double average(Double value, Integer numRatings) {
        return numRatings != null && numRatings == 0 ? null : value;
    }

    /** RMP reports -1 when there is no would-take-again data. */
    private static Double percentage(Double value) {
        return value == null || value < 0 ? null : value;
    }

    private JsonNode execute(String query, Map<String, Object> variables) {
        return execute(query, variables, false);
    }

    /**
     * Lenient mode returns null on any failure (used by the legacy methods). Strict mode throws
     * {@link RmpUnavailableException} so callers can tell an outage from an empty result.
     */
    private JsonNode execute(String query, Map<String, Object> variables, boolean strict) {
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
                if (strict) {
                    throw new RmpUnavailableException("RMP returned an error response");
                }
                return null;
            }
            return response.getBody();
        } catch (RestClientException exception) {
            if (strict) {
                throw new RmpUnavailableException("RMP request failed", exception);
            }
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
