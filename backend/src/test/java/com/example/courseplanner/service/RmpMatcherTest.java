package com.example.courseplanner.service;

import com.example.courseplanner.model.rmp.RmpTeacherSearchResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RmpMatcherTest {

    private final RmpMatcher matcher = new RmpMatcher();

    // ---------- selection rule ----------

    @Test
    void exactNameAndDepartmentScoresOne() {
        var match = matcher.selectBest(List.of(teacher("a", "Margaret", "Hall", "Criminology")),
                "Hall, Margaret", "Criminology").orElseThrow();
        assertEquals("a", match.teacher().rmpTeacherId());
        assertEquals(1.0, match.score(), 1e-9);
    }

    @Test
    void exactNameWithUnrelatedDepartmentStillMatches() {
        // Name alone contributes 0.8, which is above the 0.75 threshold.
        var match = matcher.selectBest(List.of(teacher("a", "Brian", "Fraser", "Mathematics")),
                "Fraser, Brian", "Computer Science").orElseThrow();
        assertTrue(match.score() >= 0.8 && match.score() < 0.9);
    }

    @Test
    void missingDepartmentContributesNothing() {
        var match = matcher.selectBest(List.of(teacher("a", "Brian", "Fraser", "Computer Science")),
                "Fraser, Brian", null).orElseThrow();
        assertEquals(0.8, match.score(), 1e-9);
    }

    @Test
    void sharedFirstNameInSameDepartmentStaysBelowThreshold() {
        // "karen yip" vs "karen yeats" ≈ 0.64 name → 0.8*0.64 + 0.2 ≈ 0.71 < 0.75.
        assertTrue(matcher.selectBest(List.of(teacher("a", "Karen", "Yeats", "Criminology")),
                "Yip, Karen", "Criminology").isEmpty());
    }

    @Test
    void highestCombinedScoreWinsAcrossCandidates() {
        var match = matcher.selectBest(List.of(
                teacher("wrong-dept", "Brian", "Fraser", "Mathematics"),
                teacher("right", "Brian", "Fraser", "Computer Science"),
                teacher("other", "Brian", "Frasier", "Computer Science")
        ), "Fraser, Brian", "Computer Science").orElseThrow();
        assertEquals("right", match.teacher().rmpTeacherId());
    }

    @Test
    void tieKeepsFirstCandidate() {
        var match = matcher.selectBest(List.of(
                teacher("first", "Margaret", "Hall", "Criminology"),
                teacher("second", "Margaret", "Hall", "Criminology")
        ), "Hall, Margaret", "Criminology").orElseThrow();
        assertEquals("first", match.teacher().rmpTeacherId());
    }

    @Test
    void noCandidatesMeansNoMatch() {
        assertTrue(matcher.selectBest(List.of(), "Hall, Margaret", "Criminology").isEmpty());
    }

    @Test
    void thresholdIsInclusive() {
        // Construct a score of exactly 0.75: name 0.9375 (1 edit in 16 chars) and no department.
        // "abcdefghijklmnop" vs "abcdefghijklmnoq" → similarity 15/16 = 0.9375 → 0.8 * 0.9375 = 0.75.
        assertEquals(0.9375, RmpMatcher.similarity("abcdefghijklmnop", "abcdefghijklmnoq"), 1e-9);
        assertTrue(matcher.selectBest(List.of(teacher("a", "abcdefghijklmnoq", "", null)),
                "abcdefghijklmnop", null).isPresent());
        assertTrue(matcher.selectBest(List.of(teacher("a", "abcdefghijklmnqq", "", null)),
                "abcdefghijklmnop", null).isEmpty());
    }

    // ---------- name handling ----------

    @Test
    void nameVariantsDropMiddleNamesAndAliases() {
        assertEquals(List.of("sarah christina ganzon", "sarah ganzon"),
                RmpMatcher.nameVariants("Ganzon, Sarah Christina"));
        assertTrue(RmpMatcher.nameVariants("Ternovska, Evgenia (Eugenia)").contains("evgenia ternovska"));
        assertEquals(List.of("margaret hall"), RmpMatcher.nameVariants("Hall, Margaret"));
    }

    @Test
    void nameVariantsKeepCompoundSurnames() {
        assertTrue(RmpMatcher.nameVariants("de Silva, Ana Maria").contains("ana de silva"));
    }

    @Test
    void nameVariantsTryEachPartOfATwoPartSurname() {
        assertEquals(List.of("claudia gomez borquez", "claudia gomez", "claudia borquez"),
                RmpMatcher.nameVariants("Gomez Borquez, Claudia"));
        assertTrue(RmpMatcher.nameVariants("Smith-Jones, Anna").containsAll(List.of("anna smith", "anna jones")));
        // Particles are never a surname on their own.
        assertEquals(List.of("ana maria de silva", "ana de silva", "ana silva"),
                RmpMatcher.nameVariants("de Silva, Ana Maria"));
        assertFalse(RmpMatcher.nameVariants("van der Berg, Jan").contains("jan van"));
        assertFalse(RmpMatcher.nameVariants("van der Berg, Jan").contains("jan der"));
    }

    @Test
    void twoPartSurnameMatchesTheShorterRmpName() {
        // RMP lists "Claudia Gomez"; CourseSys has "Gomez Borquez, Claudia". Full name alone scores ≈ 0.62.
        var match = matcher.selectBest(List.of(teacher("a", "Claudia", "Gomez", "Business")),
                "Gomez Borquez, Claudia", "Business").orElseThrow();
        assertEquals(1.0, match.score(), 1e-9);
    }

    @Test
    void nameVariantsRejectHalfNames() {
        assertThrows(IllegalArgumentException.class, () -> RmpMatcher.nameVariants("Hall,"));
        assertThrows(IllegalArgumentException.class, () -> RmpMatcher.nameVariants(", Margaret"));
        assertThrows(IllegalArgumentException.class, () -> RmpMatcher.nameVariants("   "));
    }

    @Test
    void displayAndCleanNames() {
        assertEquals("Margaret Hall", RmpMatcher.displayName("Hall, Margaret"));
        assertEquals("Evgenia Ternovska", RmpMatcher.displayName("Ternovska, Evgenia (Eugenia)"));
        assertEquals("Tamara O'Doherty", RmpMatcher.displayName("O&#39;Doherty, Tamara"));
        assertEquals("tamara odoherty", RmpMatcher.cleanName("O'Doherty,  Tamara"));
        assertEquals(RmpMatcher.cleanName("Liu, Connie"), RmpMatcher.cleanName("Liu,  Connie "));
        assertEquals("andrew s g harries", RmpMatcher.cleanName("Harries, Andrew S.G."));
    }

    @Test
    void placeholdersAreRecognised() {
        assertTrue(RmpMatcher.isPlaceholder("TBA"));
        assertTrue(RmpMatcher.isPlaceholder(" staff "));
        assertTrue(RmpMatcher.isPlaceholder("To Be Announced"));
        assertFalse(RmpMatcher.isPlaceholder("Hall, Margaret"));
    }

    // ---------- recorded cases ----------

    /**
     * 17 real lookups recorded from RMP during planning, with the correct answer for each
     * (an RMP ID, or null for "nobody suitable"). Departments use the migration's rmp_name values.
     */
    @Test
    void replaysRecordedCases() throws Exception {
        JsonNode cases;
        try (InputStream stream = getClass().getResourceAsStream("/rmp/recorded-candidates.json")) {
            assertNotNull(stream, "fixture missing");
            cases = new ObjectMapper().readTree(stream);
        }
        assertEquals(17, cases.size());
        for (JsonNode item : cases) {
            List<RmpTeacherSearchResult> candidates = new ArrayList<>();
            for (JsonNode c : item.get("candidates")) {
                candidates.add(new RmpTeacherSearchResult(
                        c.get("rmpTeacherId").asText(), c.path("legacyId").asInt(),
                        c.get("firstName").asText(), c.get("lastName").asText(),
                        c.path("department").asText(null), null, null, null, null,
                        c.path("rmpSchoolId").asText(null), c.path("schoolName").asText(null)));
            }
            String rawName = item.get("rawName").asText();
            Optional<RmpMatcher.Match> match =
                    matcher.selectBest(candidates, rawName, item.get("department").asText());
            if (item.get("expectedId").isNull()) {
                assertTrue(match.isEmpty(), rawName + " should not match, got "
                        + match.map(m -> m.teacher().firstName() + " " + m.teacher().lastName()).orElse(""));
            } else {
                assertEquals(item.get("expectedId").asText(),
                        match.map(m -> m.teacher().rmpTeacherId()).orElse(null), rawName);
            }
        }
    }

    static RmpTeacherSearchResult teacher(String id, String first, String last, String department) {
        return new RmpTeacherSearchResult(id, 1, first, last, department, 4.0, 3.0, 10, 80.0,
                "U2Nob29sLTE0ODI=", "Simon Fraser University");
    }
}
