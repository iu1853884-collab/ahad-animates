package com.ahadanimates.backend.dailywork;

import com.ahadanimates.backend.dailywork.dto.DailyWorkRequest;
import com.ahadanimates.backend.projects.ProjectStatus;
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

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DailyWorkControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DailyWorkRepository dailyWorkRepository;

    @BeforeEach
    void clearDailyWork() {
        dailyWorkRepository.deleteAll();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void administratorCanCreateReadUpdatePublishAndDeleteEntries() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/admin/daily-work")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(entry(
                                "Work log entry",
                                LocalDate.of(2026, 10, 22),
                                "Animation",
                                ProjectStatus.DRAFT
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Work log entry")))
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andReturn();
        long id = objectMapper.readTree(created.getResponse().getContentAsString())
                .get("id")
                .asLong();

        mockMvc.perform(get("/api/admin/daily-work/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workDate", is("2026-10-22")));

        mockMvc.perform(get("/api/admin/daily-work")
                        .param("category", "Animation")
                        .param("status", "DRAFT")
                        .param("fromDate", "2026-10-22")
                        .param("toDate", "2026-10-22"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.categories[0]", is("Animation")));

        DailyWorkRequest updated = new DailyWorkRequest(
                "Updated work log",
                "Updated studio work description",
                LocalDate.of(2026, 10, 23),
                "Product Visualization",
                "https://cdn.example.com/updated.png",
                null,
                ProjectStatus.PUBLISHED
        );
        mockMvc.perform(put("/api/admin/daily-work/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated work log")))
                .andExpect(jsonPath("$.status", is("PUBLISHED")));

        mockMvc.perform(patch("/api/admin/daily-work/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"DRAFT"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DRAFT")));

        mockMvc.perform(delete("/api/admin/daily-work/{id}", id))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/admin/daily-work/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void validatesRequiredFieldsUrlsAndDateFilters() throws Exception {
        DailyWorkRequest invalid = new DailyWorkRequest(
                "A",
                "",
                null,
                " ",
                "javascript:alert(1)",
                "not a url",
                ProjectStatus.DRAFT
        );
        mockMvc.perform(post("/api/admin/daily-work")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.title", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.description", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.workDate", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.thumbnailUrlValid", notNullValue()));

        mockMvc.perform(get("/api/public/daily-work")
                        .param("fromDate", "2026-10-24")
                        .param("toDate", "2026-10-22"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void managementRequiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/daily-work"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/admin/daily-work")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(entry(
                                "Work log entry",
                                LocalDate.of(2026, 10, 22),
                                "Animation",
                                ProjectStatus.DRAFT
                        ))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/daily-work")
                        .with(user("visitor").authorities(() -> "ROLE_USER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/admin/daily-work")
                        .with(user("visitor").authorities(() -> "ROLE_USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(entry(
                                "Work log entry",
                                LocalDate.of(2026, 10, 22),
                                "Animation",
                                ProjectStatus.DRAFT
                        ))))
                .andExpect(status().isForbidden());
    }

    @Test
    void publicTimelineReturnsOnlyPublishedEntriesAndSupportsFiltersAndPagination() {
        dailyWorkRepository.save(new DailyWorkEntry(
                "Published recent",
                "Published entry content",
                LocalDate.of(2026, 10, 23),
                "Animation",
                "https://cdn.example.com/published.png",
                null,
                ProjectStatus.PUBLISHED
        ));
        dailyWorkRepository.save(new DailyWorkEntry(
                "Published older",
                "Older published entry content",
                LocalDate.of(2026, 10, 20),
                "Animation",
                "https://cdn.example.com/older.png",
                null,
                ProjectStatus.PUBLISHED
        ));
        dailyWorkRepository.save(new DailyWorkEntry(
                "Private draft",
                "Draft content",
                LocalDate.of(2026, 10, 24),
                "Animation",
                "https://cdn.example.com/draft.png",
                null,
                ProjectStatus.DRAFT
        ));
        dailyWorkRepository.save(new DailyWorkEntry(
                "Other category",
                "Different category entry",
                LocalDate.of(2026, 10, 21),
                "Modeling",
                "https://cdn.example.com/modeling.png",
                null,
                ProjectStatus.PUBLISHED
        ));

        try {
            mockMvc.perform(get("/api/public/daily-work")
                            .param("category", "Animation")
                            .param("page", "0")
                            .param("size", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items", hasSize(1)))
                    .andExpect(jsonPath("$.items[0].title", is("Published recent")))
                    .andExpect(jsonPath("$.items[0].status", is("PUBLISHED")))
                    .andExpect(jsonPath("$.totalItems", is(2)))
                    .andExpect(jsonPath("$.totalPages", is(2)))
                    .andExpect(jsonPath("$.categories", hasSize(2)));

            mockMvc.perform(get("/api/public/daily-work")
                            .param("category", "Animation")
                            .param("fromDate", "2026-10-21")
                            .param("toDate", "2026-10-23"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items", hasSize(1)))
                    .andExpect(jsonPath("$.items[0].title", is("Published recent")))
                    .andExpect(jsonPath("$.items[0].status", is("PUBLISHED")));
        } catch (Exception ex) {
            throw new AssertionError("Public daily work endpoint should return filtered published entries", ex);
        }
    }

    private DailyWorkRequest entry(
            String title,
            LocalDate date,
            String category,
            ProjectStatus status
    ) {
        return new DailyWorkRequest(
                title,
                "Verified creative work recorded for a specific studio date.",
                date,
                category,
                "https://cdn.example.com/work.png",
                null,
                status
        );
    }
}
