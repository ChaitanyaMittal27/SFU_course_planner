package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.repository.BookmarkRepository;
import com.example.courseplanner.service.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/bookmarks")
public class BookmarksAdminController {

    private final JwtService jwtService;
    private final JdbcTemplate jdbcTemplate;
    private final BookmarkRepository bookmarkRepository;

    public BookmarksAdminController(JwtService jwtService, JdbcTemplate jdbcTemplate, BookmarkRepository bookmarkRepository) {
        this.jwtService = jwtService;
        this.jdbcTemplate = jdbcTemplate;
        this.bookmarkRepository = bookmarkRepository;
    }

    @GetMapping
    public ResponseEntity<AdminBookmarksResponseDTO> getBookmarkAnalytics(
        @RequestHeader("Authorization") String authHeader
    ) {
        jwtService.verifyAdmin(authHeader);

        List<AdminTopCourseDTO> topCourses = jdbcTemplate.query(
            """
            SELECT d.dept_code, c.course_number, c.title, d.name AS dept_name,
                   COUNT(*) AS bookmark_count
            FROM bookmarks b
            JOIN courses c ON b.course_id = c.course_id
            JOIN departments d ON b.dept_id = d.dept_id
            GROUP BY d.dept_code, c.course_number, c.title, d.name
            ORDER BY bookmark_count DESC
            LIMIT 20
            """,
            (rs, rowNum) -> new AdminTopCourseDTO(
                rs.getString("dept_code"),
                rs.getString("course_number"),
                rs.getString("title"),
                rs.getString("dept_name"),
                rs.getInt("bookmark_count")
            )
        );

        List<AdminDeptRankingDTO> deptRankingsRaw = jdbcTemplate.query(
            """
            SELECT d.dept_code, d.name AS dept_name, COUNT(*) AS bookmark_count
            FROM bookmarks b
            JOIN departments d ON b.dept_id = d.dept_id
            GROUP BY d.dept_code, d.name
            ORDER BY bookmark_count DESC
            """,
            (rs, rowNum) -> new AdminDeptRankingDTO(
                rs.getString("dept_code"),
                rs.getString("dept_name"),
                rs.getInt("bookmark_count"),
                0.0
            )
        );

        List<AdminBookmarkMonthDTO> monthlyGrowth = jdbcTemplate.query(
            """
            SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS count
            FROM bookmarks
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY month
            """,
            (rs, rowNum) -> new AdminBookmarkMonthDTO(
                rs.getString("month"),
                rs.getInt("count")
            )
        );

        long totalBookmarks = bookmarkRepository.count();

        Integer distinctUsers = jdbcTemplate.queryForObject(
            "SELECT COUNT(DISTINCT user_id) FROM bookmarks", Integer.class
        );
        int userCount = distinctUsers != null ? distinctUsers : 0;

        Integer distinctCourses = jdbcTemplate.queryForObject(
            "SELECT COUNT(DISTINCT course_id) FROM bookmarks", Integer.class
        );
        int uniqueCourses = distinctCourses != null ? distinctCourses : 0;

        List<AdminDeptRankingDTO> departmentRankings = deptRankingsRaw.stream()
            .map(d -> new AdminDeptRankingDTO(
                d.getDeptCode(),
                d.getDepartmentName(),
                d.getBookmarkCount(),
                totalBookmarks > 0 ? Math.round(d.getBookmarkCount() * 1000.0 / totalBookmarks) / 10.0 : 0.0
            ))
            .toList();

        AdminBookmarkStatsDTO stats = new AdminBookmarkStatsDTO();
        stats.setTotalBookmarks((int) totalBookmarks);
        stats.setAvgPerUser(userCount > 0 ? Math.round(totalBookmarks * 10.0 / userCount) / 10.0 : 0.0);
        stats.setUniqueCourses(uniqueCourses);

        if (!departmentRankings.isEmpty()) {
            stats.setTopDepartment(departmentRankings.get(0).getDeptCode());
            stats.setTopDepartmentName(departmentRankings.get(0).getDepartmentName());
        } else {
            stats.setTopDepartment("—");
            stats.setTopDepartmentName("");
        }

        return ResponseEntity.ok(new AdminBookmarksResponseDTO(stats, topCourses, departmentRankings, monthlyGrowth));
    }
}
