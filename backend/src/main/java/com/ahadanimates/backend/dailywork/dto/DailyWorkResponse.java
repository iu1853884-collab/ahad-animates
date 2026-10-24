package com.ahadanimates.backend.dailywork.dto;

import com.ahadanimates.backend.dailywork.DailyWorkEntry;
import com.ahadanimates.backend.projects.ProjectStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DailyWorkResponse(
        Long id,
        String title,
        String description,
        LocalDate workDate,
        String category,
        String thumbnailUrl,
        String videoUrl,
        ProjectStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DailyWorkResponse from(DailyWorkEntry entry) {
        return new DailyWorkResponse(
                entry.getId(),
                entry.getTitle(),
                entry.getDescription(),
                entry.getWorkDate(),
                entry.getCategory(),
                entry.getThumbnailUrl(),
                entry.getVideoUrl(),
                entry.getStatus(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
