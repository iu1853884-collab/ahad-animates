package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.projects.ProjectStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "cms_content",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cms_content_type_slug",
                columnNames = {"content_type", "slug"}
        ),
        indexes = {
                @Index(name = "idx_cms_content_type_status", columnList = "content_type, status"),
                @Index(name = "idx_cms_content_order", columnList = "content_type, display_order")
        }
)
public class ContentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 24)
    private ContentType contentType;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 200)
    private String slug;

    @Column(length = 10000)
    private String description;

    @Column(length = 1000)
    private String excerpt;

    @Column(name = "cover_image_url", length = 2048)
    private String coverImageUrl;

    @Column(length = 20000)
    private String body;

    @Column(name = "video_source", length = 2048)
    private String videoSource;

    @Column(nullable = false, length = 120)
    private String category;

    @Column(name = "tags_csv", length = 2000)
    private String tagsCsv;

    @Column(length = 160)
    private String author;

    @Column(name = "publication_date")
    private LocalDate publicationDate;

    @Column(name = "thumbnail_url", length = 2048)
    private String thumbnailUrl;

    @Column(name = "media_url", length = 2048)
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", length = 12)
    private MediaType mediaType;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected ContentItem() {
    }

    public ContentItem(ContentType contentType, String title, String slug, String category, ProjectStatus status) {
        this.contentType = contentType;
        this.title = title;
        this.slug = slug;
        this.category = category;
        this.status = status;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public ContentType getContentType() { return contentType; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getDescription() { return description; }
    public String getExcerpt() { return excerpt; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public String getBody() { return body; }
    public String getVideoSource() { return videoSource; }
    public String getCategory() { return category; }
    public String getTagsCsv() { return tagsCsv; }
    public String getAuthor() { return author; }
    public LocalDate getPublicationDate() { return publicationDate; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public String getMediaUrl() { return mediaUrl; }
    public MediaType getMediaType() { return mediaType; }
    public int getDisplayOrder() { return displayOrder; }
    public ProjectStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void update(String title, String slug, String description, String excerpt, String coverImageUrl,
                       String body, String videoSource, String category, String tagsCsv, String author,
                       LocalDate publicationDate, String thumbnailUrl, String mediaUrl, MediaType mediaType,
                       int displayOrder, ProjectStatus status) {
        this.title = title;
        this.slug = slug;
        this.description = description;
        this.excerpt = excerpt;
        this.coverImageUrl = coverImageUrl;
        this.body = body;
        this.videoSource = videoSource;
        this.category = category;
        this.tagsCsv = tagsCsv;
        this.author = author;
        this.publicationDate = publicationDate;
        this.thumbnailUrl = thumbnailUrl;
        this.mediaUrl = mediaUrl;
        this.mediaType = mediaType;
        this.displayOrder = displayOrder;
        this.status = status;
    }

    public void setStatus(ProjectStatus status) { this.status = status; }
}
