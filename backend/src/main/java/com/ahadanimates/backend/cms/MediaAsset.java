package com.ahadanimates.backend.cms;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "media_assets", indexes = @Index(name = "idx_media_assets_created", columnList = "created_at"))
public class MediaAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String storageKey;

    @Column(nullable = false, length = 2048)
    private String publicUrl;

    @Column(nullable = false, length = 255)
    private String originalFilename;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private MediaType mediaType;

    @Column(nullable = false)
    private long sizeBytes;

    private Integer width;

    private Integer height;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected MediaAsset() {
    }

    public MediaAsset(String storageKey, String publicUrl, String originalFilename, String contentType,
                      MediaType mediaType, long sizeBytes, Integer width, Integer height) {
        this.storageKey = storageKey;
        this.publicUrl = publicUrl;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.mediaType = mediaType;
        this.sizeBytes = sizeBytes;
        this.width = width;
        this.height = height;
    }

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getStorageKey() { return storageKey; }
    public String getPublicUrl() { return publicUrl; }
    public void setPublicUrl(String publicUrl) { this.publicUrl = publicUrl; }
    public String getOriginalFilename() { return originalFilename; }
    public String getContentType() { return contentType; }
    public MediaType getMediaType() { return mediaType; }
    public long getSizeBytes() { return sizeBytes; }
    public Integer getWidth() { return width; }
    public Integer getHeight() { return height; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
