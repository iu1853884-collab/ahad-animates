package com.ahadanimates.backend.projects.dto;

import com.ahadanimates.backend.projects.ProjectStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.net.URI;
import java.net.URISyntaxException;

public record ProjectRequest(
        @NotBlank @Size(min = 2, max = 160) String title,
        @NotBlank
        @Size(max = 180)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must use lowercase letters, numbers, and single hyphens")
        String slug,
        @Size(max = 5000) String description,
        @NotBlank @Size(max = 100) String category,
        @NotBlank @Size(max = 2048) String thumbnailUrl,
        @NotBlank @Size(max = 2048) String projectUrl,
        @Size(max = 2048) String videoUrl,
        @NotNull Boolean featured,
        @NotNull ProjectStatus status
) {
    @AssertTrue(message = "Thumbnail URL must be an HTTPS URL or an /images/ path")
    public boolean isThumbnailUrlValid() {
        return thumbnailUrl == null || isHttpsUrl(thumbnailUrl)
                || isLocalImagePath(thumbnailUrl) || isMediaEndpointUrl(thumbnailUrl);
    }

    @AssertTrue(message = "Project URL must be a valid HTTP or HTTPS URL")
    public boolean isProjectUrlValid() {
        return projectUrl == null || isHttpUrl(projectUrl);
    }

    @AssertTrue(message = "Video URL must be a valid HTTP or HTTPS URL")
    public boolean isVideoUrlValid() {
        return videoUrl == null || videoUrl.isBlank() || isHttpUrl(videoUrl);
    }

    private static boolean isHttpsUrl(String value) {
        return isAbsoluteHttpUrl(value) && value.regionMatches(true, 0, "https://", 0, 8);
    }

    private static boolean isHttpUrl(String value) {
        return isAbsoluteHttpUrl(value);
    }

    private static boolean isAbsoluteHttpUrl(String value) {
        try {
            URI uri = new URI(value.trim());
            String scheme = uri.getScheme();
            return uri.isAbsolute()
                    && uri.getHost() != null
                    && uri.getUserInfo() == null
                    && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme));
        } catch (URISyntaxException ex) {
            return false;
        }
    }

    private static boolean isLocalImagePath(String value) {
        return value.startsWith("/images/")
                && !value.contains("..")
                && value.matches("^/images/[A-Za-z0-9._/-]+$");
    }

    private static boolean isMediaEndpointUrl(String value) {
        try {
            URI uri = new URI(value.trim());
            String scheme = uri.getScheme();
            return uri.isAbsolute()
                    && uri.getHost() != null
                    && uri.getUserInfo() == null
                    && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                    && uri.getPath().matches("^/api/public/media/[1-9][0-9]*$");
        } catch (URISyntaxException ex) {
            return false;
        }
    }
}
