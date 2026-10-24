package com.ahadanimates.backend.auth;

import com.ahadanimates.backend.auth.dto.LoginRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/auth/login - Success with seeded credentials returns 200, JWT and HttpOnly cookie")
    void testSuccessfulLogin() throws Exception {
        LoginRequest request = new LoginRequest("testadmin@ahadanimates.com", "TestAdminSecurePassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("access_token=")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(jsonPath("$.message", is("Login successful")))
                .andExpect(jsonPath("$.user.email", is("testadmin@ahadanimates.com")))
                .andExpect(jsonPath("$.user.role", is("ROLE_ADMIN")))
                .andExpect(jsonPath("$.token", not(emptyOrNullString())));
    }

    @Test
    @DisplayName("POST /api/auth/login - Invalid password returns 401 and generic error message")
    void testFailedLoginInvalidPassword() throws Exception {
        LoginRequest request = new LoginRequest("testadmin@ahadanimates.com", "WrongPassword999!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("POST /api/auth/login - Invalid email format returns 400 Bad Request")
    void testValidationFailure() throws Exception {
        LoginRequest request = new LoginRequest("not-an-email", "Short");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.email", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/auth/me - Unauthorized when no cookie or header is provided")
    void testMeUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/auth/me - Authorized when valid access_token cookie is present")
    void testMeAuthorizedWithCookie() throws Exception {
        LoginRequest request = new LoginRequest("testadmin@ahadanimates.com", "TestAdminSecurePassword123!");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        jakarta.servlet.http.Cookie cookie = loginResult.getResponse().getCookie("access_token");

        mockMvc.perform(get("/api/auth/me")
                        .cookie(new Cookie("access_token", cookie.getValue())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("testadmin@ahadanimates.com")))
                .andExpect(jsonPath("$.role", is("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("POST /api/auth/logout - Clears cookie by setting maxAge to 0")
    void testLogout() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
    }
}
