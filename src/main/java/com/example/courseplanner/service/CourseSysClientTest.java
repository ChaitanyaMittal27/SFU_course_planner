package com.example.courseplanner.service;

import com.example.courseplanner.model.*;


public class CourseSysClientTest {

    public static void main(String[] args) {

        CourseSysClient client = new CourseSysClient();

        // === Test parameters ===
        String dept = "CMPT";
        String courseNumber = "276";
        int semesterCode = 1257; // Fall 2025

        System.out.println("======================================");
        System.out.println("Testing CourseSysClient");
        System.out.println("Dept: " + dept);
        System.out.println("Course: " + courseNumber);
        System.out.println("Semester Code: " + semesterCode);
        System.out.println("======================================");

        CourseSysBrowseResult result =
                client.fetchCourseSections(dept, courseNumber, semesterCode);

        System.out.println("\n=== Parsed Result ===");
        System.out.println("Year      : " + result.getYear());
        System.out.println("Semester  : " + result.getSemester());
        System.out.println("Dept      : " + result.getDept());
        System.out.println("Course #  : " + result.getCourseNumber());
        System.out.println("Title     : " + result.getTitle());
        System.out.println("Offerings : " + result.getOfferings().size());

        System.out.println("\n=== Offerings ===");

        for (CourseSysOffering o : result.getOfferings()) {
            System.out.println("--------------------------------------");
            System.out.println("Section    : " + o.getSection());
            System.out.println("Instructor : " + o.getInstructor());
            System.out.println("Campus     : " + o.getCampus());
            System.out.println("Enrolled   : " + o.getEnrolled());
            System.out.println("Capacity   : " + o.getCapacity());
            Long load = o.getLoadPercent();
            System.out.println("Load %     : " + load + "%");
            System.out.println("Info URL   : " + o.getInfoUrl());
        }

        System.out.println("\n======================================");
        System.out.println("CourseSysClient test completed.");
        System.out.println("======================================");
    }
}
