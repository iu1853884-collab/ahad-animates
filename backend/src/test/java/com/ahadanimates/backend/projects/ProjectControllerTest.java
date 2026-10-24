package com.ahadanimates.backend.projects;

import com.ahadanimates.backend.projects.dto.ProjectRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProjectRepository projectRepository;

    @BeforeEach
    void clearProjects() {
        projectRepository.deleteAll();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanCreateViewUpdatePublishAndDeleteProject() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/admin/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(project("phase-two-project", ProjectStatus.DRAFT))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Phase Two Project")))
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andReturn();

        long id = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id")
                .asLong();

        mockMvc.perform(get("/api/admin/projects/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("phase-two-project")));

        mockMvc.perform(get("/api/admin/projects")
                        .param("status", "DRAFT")
                        .param("category", "Animation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/public/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(get("/api/public/projects/{slug}", "phase-two-project"))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/admin/projects/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"PUBLISHED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PUBLISHED")));

        mockMvc.perform(get("/api/public/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].slug", is("phase-two-project")));

        mockMvc.perform(get("/api/public/projects/{slug}", "phase-two-project"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PUBLISHED")));

        ProjectRequest updated = new ProjectRequest(
                "Updated Phase Two Project",
                "phase-two-project",
                "An optional verified description.",
                "Animation",
                "https://cdn.example.com/updated.png",
                "https://example.com/project",
                null,
                true,
                ProjectStatus.PUBLISHED
        );
        mockMvc.perform(put("/api/admin/projects/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Phase Two Project")))
                .andExpect(jsonPath("$.featured", is(true)));

        mockMvc.perform(get("/api/public/projects/{slug}", "phase-two-project"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Phase Two Project")))
                .andExpect(jsonPath("$.featured", is(true)));

        mockMvc.perform(delete("/api/admin/projects/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/admin/projects/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void rejectsInvalidProjectAndDuplicateSlug() throws Exception {
        ProjectRequest invalid = new ProjectRequest(
                "Invalid Project",
                "Invalid Slug",
                null,
                "Animation",
                "javascript:alert(1)",
                "not a URL",
                null,
                false,
                ProjectStatus.DRAFT
        );
        mockMvc.perform(post("/api/admin/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.slug", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.thumbnailUrlValid", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.projectUrlValid", notNullValue()));

        String validProject = objectMapper.writeValueAsString(project("duplicate-slug", ProjectStatus.DRAFT));
        mockMvc.perform(post("/api/admin/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validProject))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/admin/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validProject))
                .andExpect(status().isConflict());
    }

    @Test
    void adminEndpointsRejectUnauthenticatedVisitorsAndNonAdmins() throws Exception {
        String projectJson = objectMapper.writeValueAsString(project("protected-project", ProjectStatus.DRAFT));
        var nonAdmin = org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                .user("visitor")
                .authorities(() -> "ROLE_USER");

        mockMvc.perform(get("/api/admin/projects"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/admin/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectJson))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/admin/projects/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectJson))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/admin/projects/{id}/status", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"PUBLISHED"}
                                """))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/admin/projects/{id}", 1L))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/projects")
                        .with(nonAdmin))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/admin/projects")
                        .with(nonAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectJson))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/admin/projects/{id}", 1L)
                        .with(nonAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectJson))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/projects/{id}/status", 1L)
                        .with(nonAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"PUBLISHED"}
                                """))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/admin/projects/{id}", 1L)
                        .with(nonAdmin))
                .andExpect(status().isForbidden());
    }

    private ProjectRequest project(String slug, ProjectStatus status) {
        String title = slug.equals("phase-two-project") ? "Phase Two Project" : "Test Project";
        return new ProjectRequest(
                title,
                slug,
                null,
                "Animation",
                "https://cdn.example.com/thumbnail.png",
                "https://example.com/project",
                null,
                false,
                status
        );
    }
}
