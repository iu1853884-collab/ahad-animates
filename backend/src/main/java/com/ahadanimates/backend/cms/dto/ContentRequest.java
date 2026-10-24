package com.ahadanimates.backend.cms.dto;

import com.ahadanimates.backend.cms.MediaType;
import com.ahadanimates.backend.projects.ProjectStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record ContentRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 200)
        @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*", message = "Use lowercase letters and numbers separated by hyphens")
        String slug,
        @Size(max = 10000) String description,
        @Size(max = 1000) String excerpt,
        @Size(max = 2048) String coverImageUrl,
        @Size(max = 20000) String body,
        @Size(max = 2048) String videoSource,
        @NotBlank @Size(max = 120) String category,
        @Size(max = 30) List<@NotBlank @Size(max = 60) String> tags,
        @Size(max = 160) String author,
        LocalDate publicationDate,
        @Size(max = 2048) String thumbnailUrl,
        @Size(max = 2048) String mediaUrl,
        MediaType mediaType,
        @Min(0) @Max(100000) int displayOrder,
        @NotNull ProjectStatus status
) {
}
