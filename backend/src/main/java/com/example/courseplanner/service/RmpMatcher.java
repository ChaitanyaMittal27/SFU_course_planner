package com.example.courseplanner.service;

import com.example.courseplanner.model.rmp.RmpTeacherSearchResult;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Name handling and candidate selection for RMP matching. Pure logic: no network, no database.
 *
 * Selection rule: every candidate gets
 * {@code 0.8 × name similarity + 0.2 × department similarity} (normalized Levenshtein, 0–1).
 * The highest score wins; if it is below {@link #MATCH_THRESHOLD} there is no match.
 * Name similarity is the best score over the CourseSys name's variants (see {@link #nameVariants}).
 */
@Component
public class RmpMatcher {

    public static final double NAME_WEIGHT = 0.8;
    public static final double DEPARTMENT_WEIGHT = 0.2;
    public static final double MATCH_THRESHOLD = 0.75;

    /** CourseSys values that are not a person. */
    private static final Set<String> PLACEHOLDERS = Set.of("staff", "tba", "tbd", "to be announced");

    /** Surname words that are never a surname on their own ("de Silva" never becomes "Ana De"). */
    private static final Set<String> SURNAME_PARTICLES =
            Set.of("van", "von", "der", "den", "del", "della", "dos", "das", "les", "bin", "ibn");

    public record Match(RmpTeacherSearchResult teacher, double score) {}

    /**
     * Picks the best candidate, or empty when there are none or the best scores below the threshold.
     * Ties keep the first candidate seen (both are equally good by our measure).
     *
     * @param rawName    CourseSys name, e.g. "Hall, Margaret"
     * @param department the course department's RMP label ({@code departments.rmp_name}); may be null
     */
    public Optional<Match> selectBest(List<RmpTeacherSearchResult> candidates, String rawName, String department) {
        List<String> variants = nameVariants(rawName);
        String departmentText = comparisonText(department);
        Match best = null;
        for (RmpTeacherSearchResult teacher : candidates) {
            double score = score(teacher, variants, departmentText);
            if (best == null || score > best.score()) {
                best = new Match(teacher, score);
            }
        }
        return best != null && best.score() >= MATCH_THRESHOLD ? Optional.of(best) : Optional.empty();
    }

    private static double score(RmpTeacherSearchResult teacher, List<String> variants, String departmentText) {
        String teacherName = comparisonText(teacher.firstName() + " " + teacher.lastName());
        double name = variants.stream()
                .mapToDouble(variant -> similarity(comparisonText(variant), teacherName))
                .max()
                .orElse(0);
        double department = similarity(departmentText, comparisonText(teacher.department()));
        return NAME_WEIGHT * name + DEPARTMENT_WEIGHT * department;
    }

    // =====================================================
    // Name handling
    // =====================================================

    /** HTML-decodes a CourseSys name and collapses whitespace: "O&#39;Doherty,  Tamara" → "O'Doherty, Tamara". */
    public static String decode(String raw) {
        return raw == null ? "" : HtmlUtils.htmlUnescape(raw).trim().replaceAll("\\s+", " ");
    }

    public static boolean isPlaceholder(String name) {
        return PLACEHOLDERS.contains(decode(name).toLowerCase(Locale.ROOT));
    }

    /** "Ternovska, Evgenia (Eugenia)" → "Evgenia Ternovska". Used for display and the RMP search link. */
    public static String displayName(String raw) {
        String name = decode(raw).replaceAll("\\([^)]*\\)", " ");
        String[] parts = name.split(",", 2);
        String ordered = parts.length == 2 ? parts[1] + " " + parts[0] : name;
        return ordered.trim().replaceAll("\\s+", " ");
    }

    /** Lookup key: lowercase display name without punctuation, e.g. "tamara odoherty". */
    public static String cleanName(String raw) {
        return comparisonText(displayName(raw));
    }

    /**
     * Search/scoring variants of a CourseSys "Surname, Given names" value:
     * the full name, the name without "(alias)", first given name + full surname, and, for a
     * multi-word surname, first given name + each surname word (particles like "de"/"van" skipped).
     * "Ganzon, Sarah Christina" → ["sarah christina ganzon", "sarah ganzon"];
     * "Gomez Borquez, Claudia" → ["claudia gomez borquez", "claudia gomez", "claudia borquez"].
     * Each variant is also an RMP search, so a two-word surname costs two more searches per school.
     *
     * @throws IllegalArgumentException if the name has no searchable text or an empty side of the comma
     */
    public static List<String> nameVariants(String raw) {
        String decoded = decode(raw);
        LinkedHashSet<String> names = new LinkedHashSet<>();
        String[] parts = decoded.split(",", 2);
        if (parts.length == 2) {
            String surname = parts[0].trim();
            String given = parts[1].replaceAll("\\([^)]*\\)", " ").trim();
            if (surname.isEmpty() || given.isEmpty()) {
                throw new IllegalArgumentException("Instructor name needs a surname and a given name");
            }
            String firstGiven = given.split("\\s+")[0];
            names.add(lower(parts[1] + " " + parts[0]));
            names.add(lower(given + " " + surname));
            names.add(lower(firstGiven + " " + surname));
            // RMP often lists only one part of a two-part surname ("Gomez Borquez" → "Claudia Gomez").
            String[] surnameParts = surname.split("[\\s-]+");
            if (surnameParts.length > 1) {
                for (String part : surnameParts) {
                    if (part.length() > 2 && !SURNAME_PARTICLES.contains(part.toLowerCase(Locale.ROOT))) {
                        names.add(lower(firstGiven + " " + part));
                    }
                }
            }
        } else {
            names.add(lower(decoded));
            names.add(lower(decoded.replaceAll("\\([^)]*\\)", " ")));
        }
        names.removeIf(String::isBlank);
        if (names.isEmpty()) {
            throw new IllegalArgumentException("Instructor name has no searchable text");
        }
        return List.copyOf(names);
    }

    private static String lower(String value) {
        return value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    /** Lowercase; apostrophes removed; other punctuation and symbols become spaces. */
    static String comparisonText(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("['’‘ʼ]", "")
                .replaceAll("[\\p{P}\\p{S}]", " ")
                .trim()
                .replaceAll("\\s+", " ")
                .toLowerCase(Locale.ROOT);
    }

    /** Normalized Levenshtein similarity in [0, 1]. Empty text on either side scores 0 (no evidence). */
    static double similarity(String first, String second) {
        if (first.isEmpty() || second.isEmpty()) {
            return 0;
        }
        int[] a = first.codePoints().toArray();
        int[] b = second.codePoints().toArray();
        int[] previous = new int[b.length + 1];
        for (int j = 0; j <= b.length; j++) {
            previous[j] = j;
        }
        for (int i = 1; i <= a.length; i++) {
            int[] current = new int[b.length + 1];
            current[0] = i;
            for (int j = 1; j <= b.length; j++) {
                int substitution = previous[j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1);
                current[j] = Math.min(Math.min(current[j - 1] + 1, previous[j] + 1), substitution);
            }
            previous = current;
        }
        return 1.0 - (double) previous[b.length] / Math.max(a.length, b.length);
    }
}
