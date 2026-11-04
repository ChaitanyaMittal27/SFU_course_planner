package com.example.courseplanner.controller;

import com.example.courseplanner.exception.ForbiddenException;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@Import(GlobalExceptionHandler.class)
class AdminControllerTest {

    private static final String AUTHORIZATION = "Bearer admin-token";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    @Test
    void returnsTheAdminCapabilitySummary() throws Exception {
        mockMvc.perform(get("/api/admin").header("Authorization", AUTHORIZATION))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.role").value("admin"))
                .andExpect(jsonPath("$.availablePaths.length()").value(6))
                .andExpect(jsonPath("$.availablePaths[0]").value("/api/admin/health"))
                .andExpect(jsonPath("$.availablePaths[4]").value("/api/admin/bookmarks"))
                .andExpect(jsonPath("$.availablePaths[5]").value("/api/admin/rmp"));

        verify(jwtService).verifyAdmin(AUTHORIZATION);
    }

    @Test
    void deniesNonAdminTokens() throws Exception {
        doThrow(new ForbiddenException("Access denied: not an admin"))
                .when(jwtService).verifyAdmin(AUTHORIZATION);

        mockMvc.perform(get("/api/admin").header("Authorization", AUTHORIZATION))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
