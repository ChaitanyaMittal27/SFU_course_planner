package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.repository.BookmarkRepository;
import com.example.courseplanner.repository.BookmarkWithCourseInfo;
import com.example.courseplanner.service.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class UsersController {

    private final JwtService jwtService;
    private final JdbcTemplate jdbcTemplate;
    private final BookmarkRepository bookmarkRepository;

    private static final String USERS_QUERY = """
        SELECT
          u.id,
          u.email,
          u.created_at,
          u.last_sign_in_at,
          u.raw_app_meta_data->>'provider' AS provider,
          u.raw_user_meta_data->>'display_name' AS display_name,
          (u.raw_user_meta_data->>'email_verified')::boolean AS email_verified,
          COALESCE(u.is_anonymous, false) AS is_anonymous,
          COALESCE(p.email_notifications_enabled, false) AS email_notifications_enabled,
          p.user_email AS preferred_email,
          p.last_notified_at,
          COALESCE(b.bookmark_count, 0) AS bookmark_count
        FROM auth.users u
        LEFT JOIN public.user_preferences p ON u.id = p.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS bookmark_count
          FROM public.bookmarks
          GROUP BY user_id
        ) b ON u.id = b.user_id
        """;

    public UsersController(JwtService jwtService, JdbcTemplate jdbcTemplate, BookmarkRepository bookmarkRepository) {
        this.jwtService = jwtService;
        this.jdbcTemplate = jdbcTemplate;
        this.bookmarkRepository = bookmarkRepository;
    }

    @GetMapping
    public ResponseEntity<AdminUsersResponseDTO> getUsers(
        @RequestHeader("Authorization") String authHeader
    ) {
        jwtService.verifyAdmin(authHeader);

        List<AdminUserDTO> users = jdbcTemplate.query(
            USERS_QUERY + " ORDER BY u.created_at DESC",
            new AdminUserRowMapper()
        );

        AdminUserStatsDTO stats = computeStats(users);
        return ResponseEntity.ok(new AdminUsersResponseDTO(stats, users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDetailResponseDTO> getUserDetail(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable String id
    ) {
        jwtService.verifyAdmin(authHeader);

        List<AdminUserDTO> results = jdbcTemplate.query(
            USERS_QUERY + " WHERE u.id = ?::uuid",
            new AdminUserRowMapper(),
            id
        );

        if (results.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        AdminUserDTO user = results.get(0);

        List<BookmarkWithCourseInfo> rawBookmarks =
            bookmarkRepository.findAllByUserIdsWithCourseInfo(new String[]{id});

        List<AdminUserBookmarkDTO> bookmarks = rawBookmarks.stream()
            .map(b -> new AdminUserBookmarkDTO(
                b.getBookmarkId(),
                b.getDeptCode(),
                b.getCourseNumber(),
                b.getTitle(),
                b.getSection(),
                b.getSemesterCode()
            ))
            .toList();

        return ResponseEntity.ok(new AdminUserDetailResponseDTO(user, bookmarks));
    }

    private AdminUserStatsDTO computeStats(List<AdminUserDTO> users) {
        AdminUserStatsDTO stats = new AdminUserStatsDTO();
        stats.setTotalUsers(users.size());

        YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
        Instant thirtyDaysAgo = LocalDate.now(ZoneOffset.UTC).minusDays(30)
            .atStartOfDay(ZoneOffset.UTC).toInstant();

        int newThisMonth = 0;
        int optedIn = 0;
        int active30d = 0;
        int google = 0;

        for (AdminUserDTO u : users) {
            if (u.getCreatedAt() != null) {
                Instant created = Instant.parse(u.getCreatedAt());
                YearMonth createdMonth = YearMonth.from(created.atZone(ZoneOffset.UTC));
                if (createdMonth.equals(currentMonth)) newThisMonth++;
            }

            if (Boolean.TRUE.equals(u.getEmailNotificationsEnabled())) optedIn++;

            if (u.getLastSignInAt() != null) {
                Instant lastSign = Instant.parse(u.getLastSignInAt());
                if (lastSign.isAfter(thirtyDaysAgo)) active30d++;
            }

            if ("google".equalsIgnoreCase(u.getProvider())) google++;
        }

        stats.setNewThisMonth(newThisMonth);
        stats.setOptedInNotifications(optedIn);
        stats.setActiveInLast30Days(active30d);
        stats.setProviderGoogle(google);
        stats.setProviderEmail(users.size() - google);
        return stats;
    }

    private static class AdminUserRowMapper implements RowMapper<AdminUserDTO> {
        @Override
        public AdminUserDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
            AdminUserDTO dto = new AdminUserDTO();
            dto.setId(rs.getString("id"));
            dto.setEmail(rs.getString("email"));
            dto.setCreatedAt(timestampToIso(rs.getTimestamp("created_at")));
            dto.setLastSignInAt(timestampToIso(rs.getTimestamp("last_sign_in_at")));
            dto.setProvider(rs.getString("provider"));
            dto.setDisplayName(rs.getString("display_name"));
            dto.setEmailVerified(rs.getBoolean("email_verified"));
            dto.setIsAnonymous(rs.getBoolean("is_anonymous"));
            dto.setEmailNotificationsEnabled(rs.getBoolean("email_notifications_enabled"));
            dto.setPreferredEmail(rs.getString("preferred_email"));
            dto.setLastNotifiedAt(timestampToIso(rs.getTimestamp("last_notified_at")));
            dto.setBookmarkCount(rs.getInt("bookmark_count"));
            return dto;
        }

        private String timestampToIso(Timestamp ts) {
            if (ts == null) return null;
            return ts.toInstant().toString();
        }
    }
}
