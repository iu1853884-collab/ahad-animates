package com.ahadanimates.backend.dailywork.dto;

import com.ahadanimates.backend.projects.ProjectStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDate;

public record DailyWorkRequest(
        @NotBlank @Size(min = 2, max = 160) String title,
        @NotBlank @Size(max = 5000) String description,
        @NotNull LocalDate workDate,
        @NotBlank @Size(max = 100) String category,
        @NotBlank @Size(max = 2048) String thumbnailUrl,
        @Size(max = 2048) String videoUrl,
        @NotNull ProjectStatus status
) {
    @AssertTrue(message = "Thumbnail must be an HTTPS URL or an /images/ path")
    public boolean isThumbnailUrlValid() {
        return thumbnailUrl == null || isHttpsUrl(thumbnailUrl) || isLocalImagePath(thumbnailUrl);
    }

    @AssertTrue(message = "Video URL must be a valid HTTP or HTTPS URL")
    public boolean isVideoUrlValid() {
        return videoUrl == null || videoUrl.isBlank() || isHttpUrl(videoUrl);
    }

    private static boolean isHttpsUrl(String value) {
        return isHttpUrl(value) && value.trim().regionMatches(true, 0, "https://", 0, 8);
    }

    private static boolean isHttpUrl(String value) {
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
}
