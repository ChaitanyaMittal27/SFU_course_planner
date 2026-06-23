package com.example.courseplanner.scheduler;

import com.example.courseplanner.entity.UserPreference;
import com.example.courseplanner.model.CourseSysBrowseResult;
import com.example.courseplanner.model.CourseSysOffering;
import com.example.courseplanner.repository.BookmarkRepository;
import com.example.courseplanner.repository.BookmarkWithCourseInfo;
import com.example.courseplanner.repository.UserPreferenceRepository;
import com.example.courseplanner.service.CourseSysClient;
import com.example.courseplanner.service.EmailService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);
    private static final ZoneId VANCOUVER = ZoneId.of("America/Vancouver");

    private final UserPreferenceRepository userPreferenceRepository;
    private final BookmarkRepository bookmarkRepository;
    private final CourseSysClient courseSysClient;
    private final EmailService emailService;

    public NotificationScheduler(
            UserPreferenceRepository userPreferenceRepository,
            BookmarkRepository bookmarkRepository,
            CourseSysClient courseSysClient,
            EmailService emailService
    ) {
        this.userPreferenceRepository = userPreferenceRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.courseSysClient = courseSysClient;
        this.emailService = emailService;
    }

    public record NotificationResult(
        int usersFound,
        int bookmarksFound,
        int uniqueOfferingsFound,
        int emailsSent,
        List<String> emailsSentTo,
        List<String> offeringsFetched,
        List<String> failedOfferings
    ) {}

    @Scheduled(cron = "0 5 0 * * *", zone = "America/Vancouver")
    public void runScheduled() {
        sendDailyNotifications();
    }

    @Transactional
    public NotificationResult sendDailyNotifications() {
        log.info("Starting daily notification job");

        List<String> emailsSentTo = new ArrayList<>();
        List<String> offeringsFetched = new ArrayList<>();
        List<String> failedOfferings = new ArrayList<>();

        // Step 1: fetch opted-in users
        List<UserPreference> users = userPreferenceRepository.findAllWithNotificationsEnabled();
        if (users.isEmpty()) {
            log.info("No users opted in for notifications, skipping");
            return new NotificationResult(0, 0, 0, 0, emailsSentTo, offeringsFetched, failedOfferings);
        }
        log.info("Found {} opted-in users", users.size());

        // Step 2: batch-fetch all bookmarks
        String[] userIds = users.stream()
                .map(u -> u.getUserId().toString())
                .toArray(String[]::new);

        List<BookmarkWithCourseInfo> allBookmarks =
                bookmarkRepository.findAllByUserIdsWithCourseInfo(userIds);

        if (allBookmarks.isEmpty()) {
            log.info("No bookmarks found for opted-in users, skipping");
            return new NotificationResult(users.size(), 0, 0, 0, emailsSentTo, offeringsFetched, failedOfferings);
        }
        log.info("Fetched {} total bookmarks across all users", allBookmarks.size());

        // Step 3: group by user
        Map<String, List<BookmarkWithCourseInfo>> byUser = allBookmarks.stream()
                .collect(Collectors.groupingBy(BookmarkWithCourseInfo::getUserId));

        // Step 4: deduplicate offerings
        Set<String> uniqueOfferings = allBookmarks.stream()
                .map(b -> b.getDeptCode() + "-" + b.getCourseNumber() + "-" + b.getSemesterCode())
                .collect(Collectors.toSet());

        // Step 5: fetch CourseSys once per unique offering
        log.info("Fetching CourseSys data for {} unique offerings", uniqueOfferings.size());
        Map<String, CourseSysBrowseResult> cache = new HashMap<>();

        for (String key : uniqueOfferings) {
            String[] parts = key.split("-");
            String dept = parts[0];
            String courseNumber = parts[1];
            long semesterCode = Long.parseLong(parts[2]);

            try {
                CourseSysBrowseResult result =
                        courseSysClient.fetchCourseSections(dept, courseNumber, semesterCode);
                cache.put(key, result);
                offeringsFetched.add(key);
                log.info("Fetched CourseSys data for {}", key);
            } catch (Exception e) {
                log.warn("Failed to fetch CourseSys data for {}: {}", key, e.getMessage());
                failedOfferings.add(key);
            }

            try {
                Thread.sleep(150);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Notification job interrupted during CourseSys fetch");
                return new NotificationResult(
                    users.size(), allBookmarks.size(), uniqueOfferings.size(),
                    emailsSentTo.size(), emailsSentTo, offeringsFetched, failedOfferings
                );
            }
        }

        // Step 6: build and send per-user emails
        String today = LocalDate.now(VANCOUVER)
                .format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));

        for (UserPreference user : users) {
            String userId = user.getUserId().toString();
            List<BookmarkWithCourseInfo> userBookmarks = byUser.get(userId);

            if (userBookmarks == null || userBookmarks.isEmpty()) {
                continue;
            }

            String html = buildDigestHtml(userBookmarks, cache, today);
            String subject = "SFU Course Planner — Daily Enrollment Update";
            emailService.sendNotificationDigest(user.getUserEmail(), subject, html);
            emailsSentTo.add(user.getUserEmail());
            log.info("Sent digest to {}", user.getUserEmail());
        }

        // Step 7: batch update last_notified_at
        Instant now = Instant.now();
        for (UserPreference user : users) {
            user.setLastNotifiedAt(now);
        }
        userPreferenceRepository.saveAll(users);

        log.info("Notification job complete: {} emails sent, {} users updated",
                emailsSentTo.size(), users.size());

        return new NotificationResult(
            users.size(),
            allBookmarks.size(),
            uniqueOfferings.size(),
            emailsSentTo.size(),
            emailsSentTo,
            offeringsFetched,
            failedOfferings
        );
    }

    public NotificationResult triggerNotifications() {
        return sendDailyNotifications();
    }

    private String buildDigestHtml(
            List<BookmarkWithCourseInfo> bookmarks,
            Map<String, CourseSysBrowseResult> cache,
            String today
    ) {
        StringBuilder rows = new StringBuilder();

        for (BookmarkWithCourseInfo bk : bookmarks) {
            String cacheKey = bk.getDeptCode() + "-" + bk.getCourseNumber() + "-" + bk.getSemesterCode();
            CourseSysBrowseResult result = cache.get(cacheKey);

            String section = bk.getSection();
            String title = bk.getTitle();
            String semester = decodeSemester(bk.getSemesterCode());
            String enrolled = "—";
            String capacity = "—";
            String status = "Unknown";
            String statusColor = "#888";

            if (result != null) {
                for (CourseSysOffering offering : result.getOfferings()) {
                    if (offering.getSection().equalsIgnoreCase(bk.getSection())) {
                        enrolled = offering.getEnrolled();
                        capacity = offering.getCapacity();
                        long load = offering.getLoadPercent();
                        if (load >= 100) {
                            status = "Full";
                            statusColor = "#c23032";
                        } else if (load >= 90) {
                            status = "Almost Full";
                            statusColor = "#e8824a";
                        } else {
                            status = "Open";
                            statusColor = "#16a34a";
                        }
                        break;
                    }
                }
            }

            rows.append(String.format("""
                    <tr>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; color: #6b7280;">%s</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; font-weight: 600;">%s</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; color: #374151;">%s</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px;">%s / %s</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; color: %s; font-weight: 600;">%s</td>
                    </tr>
                    """, semester, section, title, enrolled, capacity, statusColor, status));
        }

        return String.format("""
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
                <tr><td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                    <tr>
                        <td align="center" style="padding-bottom:24px;">
                        <img src="https://sfucourseplanner.com/favicon.png" width="48" height="48" alt="SFU Course Planner" style="display:block;margin:0 auto 12px auto;" />
                        <span style="font-size:20px;font-weight:700;color:#111827;">SFU Course Planner</span>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#ffffff;border-radius:12px;padding:40px 48px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                        <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:#111827;">Enrollment Update</h1>
                        <p style="margin:0 0 24px 0;font-size:14px;color:#9ca3af;">%s</p>

                        <table style="width:100%%;border-collapse:collapse;">
                            <thead>
                            <tr style="background:#f9fafb;">
                                <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Term</th>
                                <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Section</th>
                                <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Title</th>
                                <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Enrolled</th>
                                <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Status</th>
                            </tr>
                            </thead>
                            <tbody>%s</tbody>
                        </table>

                        <p style="margin:24px 0 0 0;font-size:13px;color:#9ca3af;">
                            Manage your bookmarks and notification preferences at
                            <a href="https://sfucourseplanner.com/dashboard" style="color:#c23032;text-decoration:none;">sfucourseplanner.com</a>
                        </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding-top:28px;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 SFU Course Planner</p>
                        </td>
                    </tr>

                    </table>
                </td></tr>
                </table>
                </body>
                </html>
                """, today, rows.toString());
    }

    private String decodeSemester(Long semesterCode) {
        if (semesterCode == null) return "—";
        long year = 1900 + semesterCode / 10;
        long term = semesterCode % 10;
        String termName = switch ((int) term) {
            case 1 -> "Spring";
            case 4 -> "Summer";
            case 7 -> "Fall";
            default -> "Unknown";
        };
        return termName + " " + year;
    }
}