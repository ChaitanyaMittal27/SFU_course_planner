package com.example.courseplanner.controller;

import com.example.courseplanner.dto.HealthCheckDTO;
import com.example.courseplanner.service.JwtService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/admin/health")
public class HealthController {

    private final JwtService jwtService;
    private final DataSource dataSource;
    private final RestTemplate restTemplate;

    @Value("${RESEND_API_KEY}")
    private String resendApiKey;

    public HealthController(JwtService jwtService, DataSource dataSource) {
        this.jwtService = jwtService;
        this.dataSource = dataSource;
        this.restTemplate = new RestTemplate();
    }

    @GetMapping
    public ResponseEntity<List<HealthCheckDTO>> checkHealth(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(value = "service", required = false) String service
    ) {
        jwtService.verifyAdmin(authHeader);

        if (service != null) {
            return ResponseEntity.ok(List.of(runCheck(service)));
        }

        CompletableFuture<HealthCheckDTO> apiCheck = CompletableFuture.supplyAsync(() -> runCheck("api"));
        CompletableFuture<HealthCheckDTO> dbCheck = CompletableFuture.supplyAsync(() -> runCheck("database"));
        CompletableFuture<HealthCheckDTO> coursesysCheck = CompletableFuture.supplyAsync(() -> runCheck("coursesys"));
        CompletableFuture<HealthCheckDTO> coursediggersCheck = CompletableFuture.supplyAsync(() -> runCheck("coursediggers"));
        CompletableFuture<HealthCheckDTO> resendCheck = CompletableFuture.supplyAsync(() -> runCheck("resend"));

        CompletableFuture.allOf(apiCheck, dbCheck, coursesysCheck, coursediggersCheck, resendCheck).join();

        List<HealthCheckDTO> results = new ArrayList<>();
        results.add(apiCheck.join());
        results.add(dbCheck.join());
        results.add(coursesysCheck.join());
        results.add(coursediggersCheck.join());
        results.add(resendCheck.join());

        return ResponseEntity.ok(results);
    }

    private HealthCheckDTO runCheck(String service) {
        return switch (service) {
            case "api" -> new HealthCheckDTO("api", "up", 0, "/api/admin/health");
            case "database" -> checkDatabase();
            case "coursesys" -> checkCourseSys();
            case "coursediggers" -> checkCourseDiggers();
            case "resend" -> checkResend();
            default -> new HealthCheckDTO(service, "down", 0, "unknown");
        };
    }

    private HealthCheckDTO checkDatabase() {
        long start = System.currentTimeMillis();
        try (Connection conn = dataSource.getConnection()) {
            conn.createStatement().execute("SELECT 1");
            return new HealthCheckDTO("database", "up", System.currentTimeMillis() - start, "supabase-postgresql");
        } catch (Exception e) {
            return new HealthCheckDTO("database", "down", System.currentTimeMillis() - start, "supabase-postgresql");
        }
    }

    private HealthCheckDTO checkCourseSys() {
        long start = System.currentTimeMillis();
        try {
            ResponseEntity<String> response = restTemplate.getForEntity("https://coursys.sfu.ca/browse/", String.class);
            String status = response.getStatusCode().is2xxSuccessful() ? "up" : "down";
            return new HealthCheckDTO("coursesys", status, System.currentTimeMillis() - start, "coursys.sfu.ca");
        } catch (Exception e) {
            return new HealthCheckDTO("coursesys", "down", System.currentTimeMillis() - start, "coursys.sfu.ca");
        }
    }

    private HealthCheckDTO checkCourseDiggers() {
        long start = System.currentTimeMillis();
        try {
            ResponseEntity<String> response = restTemplate.getForEntity("https://www.coursediggers.com/", String.class);
            String status = response.getStatusCode().is2xxSuccessful() ? "up" : "down";
            return new HealthCheckDTO("coursediggers", status, System.currentTimeMillis() - start, "coursediggers.com");
        } catch (Exception e) {
            return new HealthCheckDTO("coursediggers", "down", System.currentTimeMillis() - start, "coursediggers.com");
        }
    }

    private HealthCheckDTO checkResend() {
    long start = System.currentTimeMillis();
    try {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + resendApiKey);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        restTemplate.exchange(
            "https://api.resend.com/emails", HttpMethod.GET, entity, String.class
        );
        return new HealthCheckDTO("resend", "up", System.currentTimeMillis() - start, "api.resend.com");
    } catch (HttpClientErrorException e) {
        // 401/403 means Resend is reachable, key is recognized — service is up
        // this is becuase our api key is send emails only so get will be unauthorized and return 401 or 403
        if (e.getStatusCode().value() == 401 || e.getStatusCode().value() == 403) {
            return new HealthCheckDTO("resend", "up", System.currentTimeMillis() - start, "api.resend.com");
        }
        return new HealthCheckDTO("resend", "down", System.currentTimeMillis() - start, "api.resend.com");
    } catch (Exception e) {
        return new HealthCheckDTO("resend", "down", System.currentTimeMillis() - start, "api.resend.com");
    }
}
}
