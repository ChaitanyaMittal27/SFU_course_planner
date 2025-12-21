/**
 * Controller to provide metadata about the application.
 * Exposes the `/api/about` endpoint, returning application name and author details.
 */


package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiAboutDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AboutController {

    @GetMapping("/about")
    public ApiAboutDTO getAboutInfo() {
        String name = "Anonymouse";
        return new ApiAboutDTO("CoursePlanner", name);
    }
}
