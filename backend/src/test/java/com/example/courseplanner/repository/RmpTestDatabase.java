package com.example.courseplanner.repository;

import java.net.URI;
import java.util.List;

/**
 * Opt-in database settings for the RMP database tests.
 *
 * Set RMP_TEST_JDBC_URL (and optionally RMP_TEST_DB_USER / RMP_TEST_DB_PASSWORD) to a LOCAL
 * Postgres that has the migrations applied, e.g. local Supabase:
 *   RMP_TEST_JDBC_URL=jdbc:postgresql://127.0.0.1:54322/postgres  RMP_TEST_DB_PASSWORD=postgres
 * Without RMP_TEST_JDBC_URL the database tests are skipped. Hosted databases are refused.
 */
public final class RmpTestDatabase {

    public static final String URL_VARIABLE = "RMP_TEST_JDBC_URL";

    private RmpTestDatabase() {
    }

    public static String url() {
        String url = System.getenv(URL_VARIABLE);
        if (url == null || !url.startsWith("jdbc:postgresql://")) {
            throw new IllegalStateException(URL_VARIABLE + " must be a jdbc:postgresql:// URL");
        }
        String host = URI.create(url.substring("jdbc:".length())).getHost();
        if (!List.of("localhost", "127.0.0.1", "[::1]").contains(host)) {
            throw new IllegalStateException("RMP database tests only run against a local database");
        }
        return url;
    }

    public static String user() {
        return System.getenv().getOrDefault("RMP_TEST_DB_USER", "postgres");
    }

    public static String password() {
        return System.getenv().getOrDefault("RMP_TEST_DB_PASSWORD", "postgres");
    }
}
