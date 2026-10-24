package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.cms.dto.ContentRequest;
import com.ahadanimates.backend.projects.Project;
import com.ahadanimates.backend.projects.ProjectRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.Comparator;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@SpringBootTest
@AutoConfigureMockMvc
class CmsControllerTest {

    private static final Path MEDIA_STORAGE_DIRECTORY = Path.of(
            System.getProperty("java.io.tmpdir"), "ahad-animates-cms-test-" + UUID.randomUUID());

    @DynamicPropertySource
    static void configureMediaStorage(DynamicPropertyRegistry registry) {
        registry.add("media.storage.directory", MEDIA_STORAGE_DIRECTORY::toString);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private MediaAssetRepository mediaAssetRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @BeforeEach
    void clearCmsContent() {
        contentRepository.deleteAll();
        projectRepository.deleteAll();
        mediaAssetRepository.deleteAll();
    }

    @org.junit.jupiter.api.AfterAll
    static void removeTestMediaDirectory() throws IOException {
        if (Files.exists(MEDIA_STORAGE_DIRECTORY)) {
            try (var paths = Files.walk(MEDIA_STORAGE_DIRECTORY)) {
                for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                    Files.deleteIfExists(path);
                }
            }
        }
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanManageContentAndPublicApiOnlyReturnsPublishedContent() throws Exception {
        mockMvc.perform(post("/api/admin/cms/tutorials")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tutorial(
                                "Tutorial Draft", "tutorial-draft", ProjectStatus.DRAFT))))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/admin/cms/tutorials")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tutorial(
                                "Published Tutorial", "published-tutorial", ProjectStatus.PUBLISHED))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/public/cms/tutorials"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].slug", is("published-tutorial")));
        mockMvc.perform(get("/api/public/cms/tutorials/{slug}", "tutorial-draft"))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/api/admin/cms/tutorials/{id}/status", contentId("tutorial-draft"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PUBLISHED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PUBLISHED")));
        mockMvc.perform(get("/api/public/cms/tutorials"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(patch("/api/admin/cms/tutorials/{id}/status", contentId("tutorial-draft"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DRAFT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DRAFT")));

        String body = objectMapper.writeValueAsString(tutorial(
                "Published Tutorial Updated", "published-tutorial", ProjectStatus.PUBLISHED));
        mockMvc.perform(put("/api/admin/cms/tutorials/{id}", contentId("published-tutorial"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Published Tutorial Updated")));

        mockMvc.perform(delete("/api/admin/cms/tutorials/{id}", contentId("tutorial-draft")))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/admin/cms/tutorials"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void rejectsInvalidTutorialsAndDuplicateSlugsAndSanitizesBlogHtml() throws Exception {
        ContentRequest invalidTutorial = new ContentRequest(
                "Invalid Tutorial", "invalid-tutorial", null, null, null, null,
                "javascript:alert(1)", "Tutorial", List.of(), null, null,
                null, null, null, 0, ProjectStatus.DRAFT
        );
        mockMvc.perform(post("/api/admin/cms/tutorials")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidTutorial)))
                .andExpect(status().isBadRequest());

        String tutorial = objectMapper.writeValueAsString(
                tutorial("A Tutorial", "unique-tutorial", ProjectStatus.PUBLISHED));
        mockMvc.perform(post("/api/admin/cms/tutorials")
                        .contentType(MediaType.APPLICATION_JSON).content(tutorial))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/admin/cms/tutorials")
                        .contentType(MediaType.APPLICATION_JSON).content(tutorial))
                .andExpect(status().isConflict());

        ContentRequest blog = new ContentRequest(
                "A Blog", "a-blog", null, "An excerpt", null,
                "<p>Safe text</p><script>alert(1)</script><img src=x onerror=alert(1)>",
                null, "Studio", List.of("news"), "Author", LocalDate.now(),
                null, null, null, 0, ProjectStatus.PUBLISHED
        );
        MvcResult blogResult = mockMvc.perform(post("/api/admin/cms/blogs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blog)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.body", not(nullValue())))
                .andExpect(jsonPath("$.body", org.hamcrest.Matchers.containsString("Safe text")))
                .andExpect(jsonPath("$.body", org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("onerror"))))
                .andReturn();
        long blogId = objectMapper.readTree(blogResult.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(get("/api/public/cms/blogs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].body", org.hamcrest.Matchers.containsString("Safe text")))
                .andExpect(jsonPath("$[0].body", org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("onerror"))));

        ContentRequest updatedBlog = new ContentRequest(
                "Updated Blog", "a-blog", null, "Updated excerpt", null, "<p>Updated body</p>",
                null, "Studio", List.of("news"), "Author", LocalDate.now(), null, null, null,
                0, ProjectStatus.PUBLISHED
        );
        mockMvc.perform(put("/api/admin/cms/blogs/{id}", blogId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedBlog)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Blog")));
        mockMvc.perform(delete("/api/admin/cms/blogs/{id}", blogId))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/public/cms/blogs/{slug}", "a-blog"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanCreateEditPublishListAndDeleteAdsAndVideos() throws Exception {
        ContentRequest ad = new ContentRequest(
                "CGI Ad", "cgi-ad", "Product CGI artwork", null, null, null, null, "Campaign",
                List.of("product"), null, null, "https://cdn.example.com/poster.png",
                "https://cdn.example.com/ad.png", com.ahadanimates.backend.cms.MediaType.IMAGE,
                0, ProjectStatus.DRAFT
        );
        MvcResult create = mockMvc.perform(post("/api/admin/cms/ads-videos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ad)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andReturn();
        long id = objectMapper.readTree(create.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/public/cms/ads-videos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        ContentRequest updated = new ContentRequest(
                "Updated CGI Ad", "cgi-ad", "Updated product CGI artwork", null, null, null, null,
                "Campaign", List.of("product", "cgi"), null, null,
                "https://cdn.example.com/poster.png", "https://cdn.example.com/ad.png",
                com.ahadanimates.backend.cms.MediaType.IMAGE, 1, ProjectStatus.PUBLISHED
        );
        mockMvc.perform(put("/api/admin/cms/ads-videos/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated CGI Ad")))
                .andExpect(jsonPath("$.status", is("PUBLISHED")));
        mockMvc.perform(get("/api/public/cms/ads-videos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Updated CGI Ad")));

        mockMvc.perform(delete("/api/admin/cms/ads-videos/{id}", id))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/public/cms/ads-videos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void adminCmsEndpointsRequireAdministratorRole() throws Exception {
        mockMvc.perform(get("/api/admin/cms/blogs"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/cms/blogs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blog())))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/cms/blogs")
                        .with(user("visitor").authorities(() -> "ROLE_USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanUploadPreviewPublishServeAndDeleteUnusedLocalMedia() throws Exception {
        mockMvc.perform(get("/api/admin/media"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        MockMultipartFile file = new MockMultipartFile(
                "file", "..\\private folder\\poster.png", "image/png", png()
        );
        MvcResult upload = mockMvc.perform(multipart("/api/admin/media").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url", org.hamcrest.Matchers.startsWith("/api/public/media/")))
                .andExpect(jsonPath("$.originalFilename", is("poster.png")))
                .andExpect(jsonPath("$.contentType", is("image/webp")))
                .andExpect(jsonPath("$.width", is(2)))
                .andExpect(jsonPath("$.height", is(2)))
                .andReturn();
        long assetId = objectMapper.readTree(upload.getResponse().getContentAsString()).get("id").asLong();
        MediaAsset asset = mediaAssetRepository.findById(assetId).orElseThrow();
        Path storedFile = MEDIA_STORAGE_DIRECTORY.resolve(asset.getStorageKey());
        org.junit.jupiter.api.Assertions.assertTrue(Files.isRegularFile(storedFile));
        org.junit.jupiter.api.Assertions.assertTrue(asset.getStorageKey().startsWith("local/"));
        org.junit.jupiter.api.Assertions.assertEquals("image/webp", asset.getContentType());
        byte[] optimizedBytes = Files.readAllBytes(storedFile);

        mockMvc.perform(get("/api/public/media/{id}", assetId).with(anonymous()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/public/media/{id}", assetId).with(user("admin").authorities(() -> "ROLE_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/webp"))
                .andExpect(content().bytes(optimizedBytes));

        String mediaUrl = "/api/public/media/" + assetId;
        projectRepository.save(new Project(
                "Temporary media reference", "temporary-media-reference", null, "Test",
                mediaUrl, "https://example.com/project", null, false, ProjectStatus.PUBLISHED));
        mockMvc.perform(get("/api/public/media/{id}", assetId).with(anonymous()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/webp"))
                .andExpect(content().bytes(optimizedBytes));
        mockMvc.perform(delete("/api/admin/media/{id}", assetId))
                .andExpect(status().isConflict());

        projectRepository.deleteAll();
        mockMvc.perform(delete("/api/admin/media/{id}", assetId))
                .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertFalse(Files.exists(storedFile));
        org.junit.jupiter.api.Assertions.assertFalse(mediaAssetRepository.existsById(assetId));
    }

    @Test
    void adminMediaLibraryRejectsUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/admin/media"))
                .andExpect(status().isUnauthorized());
        MockMultipartFile file = new MockMultipartFile("file", "poster.png", "image/png", new byte[]{1, 2, 3});
        mockMvc.perform(multipart("/api/admin/media").file(file))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/admin/media/{id}", 1))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/media")
                        .with(user("visitor").authorities(() -> "ROLE_USER")))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/admin/media/{id}", 1)
                        .with(user("visitor").authorities(() -> "ROLE_USER")))
                .andExpect(status().isForbidden());
    }

    private byte[] png() throws IOException {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }

    private long contentId(String slug) {
        return contentId(ContentType.TUTORIALS, slug);
    }

    private long contentId(ContentType type, String slug) {
        return contentRepository.findByContentTypeAndSlug(type, slug)
                .orElseThrow().getId();
    }

    private ContentRequest tutorial(String title, String slug, ProjectStatus status) {
        return new ContentRequest(title, slug, "Verified tutorial description", null, null, null,
                "https://www.youtube.com/watch?v=verified", "Blender", List.of("Blender"), null,
                null, null, null, null, 0, status);
    }

    private ContentRequest blog() {
        return new ContentRequest("Blog", "blog", null, "Excerpt", null, "<p>Body</p>", null,
                "Studio", List.of(), "Author", LocalDate.now(), null, null, null,
                0, ProjectStatus.DRAFT);
    }
}
