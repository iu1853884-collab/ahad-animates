package com.ahadanimates.backend.projects.dto;

import com.ahadanimates.backend.projects.Project;
import com.ahadanimates.backend.projects.ProjectStatus;

import java.time.LocalDateTime;

public record ProjectResponse(
        Long id,
        String title,
        String slug,
        String description,
        String category,
        String thumbnailUrl,
        String projectUrl,
        String videoUrl,
        boolean featured,
        ProjectStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getSlug(),
                project.getDescription(),
                project.getCategory(),
                project.getThumbnailUrl(),
                project.getProjectUrl(),
                project.getVideoUrl(),
                project.isFeatured(),
                project.getStatus(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
