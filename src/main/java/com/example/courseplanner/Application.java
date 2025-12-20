/**
 * The entry point for the Course Planner application.
 * This class bootstraps the Spring Boot application and provides
 * a single shared resource: a hierarchical model of departments,
 * courses, offerings, and sections loaded from a CSV file.
 */

package com.example.courseplanner;
import com.example.courseplanner.entity.*;
import com.example.courseplanner.repository.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.util.Map;


@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
