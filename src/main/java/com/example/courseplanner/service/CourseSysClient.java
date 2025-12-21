package com.example.courseplanner.service;

import com.example.courseplanner.model.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
public class CourseSysClient {

    private static final String COURSESYS_BROWSE =
            "https://coursys.sfu.ca/browse/";

    private final RestTemplate restTemplate = new RestTemplate();

    public CourseSysBrowseResult fetchCourseSections(
            String dept,
            String courseNumber,
            long semesterCode
    ) {

        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(COURSESYS_BROWSE)
                .queryParam("subject[]", dept.toUpperCase())
                .queryParam("number[]", courseNumber)
                .queryParam("semester[]", semesterCode)
                .queryParam("tabledata", "yes");

        // ✅ FIX: build as NOT encoded, then encode once (brackets become %5B%5D)
        // and pass URI to RestTemplate to avoid double-encoding.
        URI uri = builder.build(false).encode().toUri();

        ResponseEntity<Map> response =
                restTemplate.getForEntity(uri, Map.class);

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            return emptyResult(dept, courseNumber, semesterCode);
        }

        List<List<String>> rows =
                (List<List<String>>) response.getBody().get("data");

        return parseResult(rows, dept, courseNumber, semesterCode);
    }

    // -----------------------------
    // Parsing logic (mirrors Python)
    // -----------------------------

    private CourseSysBrowseResult parseResult(
            List<List<String>> rows,
            String dept,
            String courseNumber,
            long semesterCode
    ) {

        CourseSysBrowseResult result = new CourseSysBrowseResult();
        result.setDept(dept.toUpperCase());
        result.setCourseNumber(courseNumber);
        result.setSemesterCode(semesterCode);

        result.setYear(1900 + semesterCode / 10);
        result.setSemester(parseSemester(semesterCode));

        List<CourseSysOffering> offerings = new ArrayList<>();

        for (List<String> row : rows) {
            // row format:
            // [0]=term, [1]=html link, [2]=title,
            // [3]=enrollment, [4]=instructor, [5]=campus

            String title = row.get(2);
            result.setTitle(title);

            String enrollmentRaw = row.get(3); // "96/100"
            String[] parts = enrollmentRaw.split("/");

            CourseSysOffering offering = new CourseSysOffering();
            offering.setSection(extractSection(row.get(1)));
            offering.setInfoUrl(extractInfoUrl(row.get(1)));
            offering.setInstructor(row.get(4));
            offering.setCampus(row.get(5));
            offering.setEnrolled(parts[0].trim());   // "115 (+31)"
            offering.setCapacity(parts[1].trim());   // "100"
            offerings.add(offering);
        }

        result.setOfferings(offerings);
        return result;
    }

    private CourseSysBrowseResult emptyResult(
            String dept, String courseNumber, long semesterCode
    ) {
        CourseSysBrowseResult r = new CourseSysBrowseResult();
        r.setDept(dept);
        r.setCourseNumber(courseNumber);
        r.setSemesterCode(semesterCode);
        r.setOfferings(List.of());
        return r;
    }

    // -----------------------------
    // Helpers
    // -----------------------------

    private String parseSemester(long semesterCode) {
        long term = semesterCode % 10;
        return switch ((int)term) {
            case 1 -> "spring";
            case 4 -> "summer";
            case 7 -> "fall";
            default -> "unknown";
        };
    }

    private String extractSection(String html) {
        // "<a ...>CMPT 276 D100</a>" → "D100"
        int start = html.indexOf('>') + 1;
        int end = html.indexOf("</");
        String innerText = html.substring(start, end).trim(); // "CMPT 276 D100"

        String[] tokens = innerText.split("\\s+");
        return tokens[tokens.length - 1];
    }

    private String extractInfoUrl(String html) {
        // href="/browse/info/..."
        long start = html.indexOf("href=\"") + 6;
        long end = html.indexOf("\"", (int)start);
        return html.substring((int)start, (int)end);
    }
}
