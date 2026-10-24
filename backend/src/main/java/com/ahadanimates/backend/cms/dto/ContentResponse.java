package com.ahadanimates.backend.cms.dto;

import com.ahadanimates.backend.cms.ContentItem;
import com.ahadanimates.backend.cms.ContentType;
import com.ahadanimates.backend.cms.MediaType;
import com.ahadanimates.backend.projects.ProjectStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record ContentResponse(
        Long id,
        ContentType contentType,
        String title,
        String slug,
        String description,
        String excerpt,
        String coverImageUrl,
        String body,
        String videoSource,
        String category,
        List<String> tags,
        String author,
        LocalDate publicationDate,
        String thumbnailUrl,
        String mediaUrl,
        MediaType mediaType,
        int displayOrder,
        ProjectStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ContentResponse from(ContentItem item) {
        List<String> tags = item.getTagsCsv() == null || item.getTagsCsv().isBlank()
                ? List.of()
                : Arrays.stream(item.getTagsCsv().split("\\n"))
                        .filter(tag -> !tag.isBlank())
                        .toList();
        return new ContentResponse(
                item.getId(), item.getContentType(), item.getTitle(), item.getSlug(), item.getDescription(),
                item.getExcerpt(), item.getCoverImageUrl(), item.getBody(), item.getVideoSource(),
                item.getCategory(), tags, item.getAuthor(), item.getPublicationDate(), item.getThumbnailUrl(),
                item.getMediaUrl(), item.getMediaType(), item.getDisplayOrder(), item.getStatus(),
                item.getCreatedAt(), item.getUpdatedAt()
        );
    }
}
