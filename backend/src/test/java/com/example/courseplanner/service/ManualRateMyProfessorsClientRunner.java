package com.example.courseplanner.service;

import com.example.courseplanner.config.RestTemplateConfig;
import com.example.courseplanner.model.rmp.RmpSchoolSearchResult;
import com.example.courseplanner.model.rmp.RmpTeacherProfile;
import com.example.courseplanner.model.rmp.RmpTeacherSearchResult;

import java.util.List;
import java.util.Optional;
import java.util.Scanner;

/**
 * Interactive developer utility for manually checking the RMP client against
 * the live provider. It lives in test sources and is not an application endpoint.
 * 
 * Intended flow:
 * 1. Search schools
 * 2. Search teachers at an RMP school
 * 3. Fetch teacher profile by RMP ID
 * 4. Exit
 * 
 * ./gradlew --no-daemon rmpManual
 */
public class ManualRateMyProfessorsClientRunner {

    private final RateMyProfessorsClient client = new RateMyProfessorsClient(
            new RestTemplateConfig().rateMyProfessorsRestTemplate()
    );
    private final Scanner scanner = new Scanner(System.in);

    public static void main(String[] args) {
        new ManualRateMyProfessorsClientRunner().run();
    }

    private void run() {
        System.out.println("Rate My Professors manual client");
        System.out.println("Uses live provider data. No database or Spring application is started.");

        while (true) {
            System.out.println("\n1. Search schools");
            System.out.println("2. Search teachers at an RMP school");
            System.out.println("3. Fetch teacher profile by RMP ID");
            System.out.println("4. Exit");

            switch (prompt("Choose an option: ")) {
                case "1" -> searchSchools();
                case "2" -> searchTeachers();
                case "3" -> getTeacherProfile();
                case "4" -> {
                    System.out.println("Goodbye.");
                    return;
                }
                default -> System.out.println("Enter 1, 2, 3, or 4.");
            }
        }
    }

    private void searchSchools() {
        List<RmpSchoolSearchResult> schools = client.searchSchools(prompt("School name: "));
        if (schools.isEmpty()) {
            System.out.println("No schools found or RMP is unavailable.");
            return;
        }

        for (int index = 0; index < schools.size(); index++) {
            RmpSchoolSearchResult school = schools.get(index);
            System.out.printf("%n%d. %s — %s, %s%n", index + 1, school.name(), valueOrDash(school.city()), valueOrDash(school.state()));
            System.out.printf("   GraphQL ID: %s%n", school.rmpSchoolId());
            System.out.printf("   Legacy ID: %s%n", valueOrDash(school.legacyId()));
        }
    }

    private void searchTeachers() {
        String teacherName = prompt("Teacher name: ");
        String schoolId = prompt("RMP school ID (SFU Burnaby: U2Nob29sLTE0ODI=): ");
        List<RmpTeacherSearchResult> teachers = client.searchTeachers(teacherName, schoolId);
        if (teachers.isEmpty()) {
            System.out.println("No teachers found or RMP is unavailable.");
            return;
        }

        for (int index = 0; index < teachers.size(); index++) {
            RmpTeacherSearchResult teacher = teachers.get(index);
            System.out.printf("%n%d. %s %s%n", index + 1, teacher.firstName(), teacher.lastName());
            System.out.printf("   GraphQL ID: %s%n", teacher.rmpTeacherId());
            System.out.printf("   Department: %s%n", valueOrDash(teacher.department()));
            System.out.printf("   Rating: %s | Difficulty: %s | Ratings: %s | Take again: %s%n",
                    valueOrDash(teacher.avgRating()),
                    valueOrDash(teacher.avgDifficulty()),
                    valueOrDash(teacher.numRatings()),
                    valueOrDash(teacher.wouldTakeAgainPercent()));
            System.out.printf("   Profile: https://www.ratemyprofessors.com/professor/%s%n", valueOrDash(teacher.legacyId()));
        }
    }

    private void getTeacherProfile() {
        Optional<RmpTeacherProfile> profile = client.getTeacherProfile(prompt("RMP teacher ID: "));
        if (profile.isEmpty()) {
            System.out.println("No profile found or RMP is unavailable.");
            return;
        }

        RmpTeacherProfile teacher = profile.get();
        System.out.printf("%n%s %s%n", teacher.firstName(), teacher.lastName());
        System.out.printf("Department: %s%n", valueOrDash(teacher.department()));
        System.out.printf("School: %s — %s, %s%n", valueOrDash(teacher.schoolName()), valueOrDash(teacher.schoolCity()), valueOrDash(teacher.schoolState()));
        System.out.printf("Rating: %s | Difficulty: %s | Ratings: %s | Take again: %s%n",
                valueOrDash(teacher.avgRating()),
                valueOrDash(teacher.avgDifficulty()),
                valueOrDash(teacher.numRatings()),
                valueOrDash(teacher.wouldTakeAgainPercent()));
        System.out.printf("Profile: https://www.ratemyprofessors.com/professor/%s%n", valueOrDash(teacher.legacyId()));
    }

    private String prompt(String message) {
        System.out.print(message);
        return scanner.nextLine().trim();
    }

    private String valueOrDash(Object value) {
        return value == null ? "—" : value.toString();
    }
}
