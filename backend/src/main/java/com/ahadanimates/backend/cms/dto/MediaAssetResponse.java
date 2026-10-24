package com.ahadanimates.backend.cms.dto;

import com.ahadanimates.backend.cms.MediaAsset;
import com.ahadanimates.backend.cms.MediaType;

import java.time.LocalDateTime;

public record MediaAssetResponse(
        Long id,
        String url,
        String originalFilename,
        String contentType,
        MediaType mediaType,
        long sizeBytes,
        Long originalSizeBytes,
        Integer width,
        Integer height,
        LocalDateTime createdAt
) {
    public static MediaAssetResponse from(MediaAsset asset) {
        return from(asset, null);
    }

    public static MediaAssetResponse from(MediaAsset asset, Long originalSizeBytes) {
        return new MediaAssetResponse(
                asset.getId(), asset.getStorageKey().startsWith("local/")
                        ? "/api/public/media/" + asset.getId() : asset.getPublicUrl(),
                asset.getOriginalFilename(),
                asset.getContentType(), asset.getMediaType(), asset.getSizeBytes(),
                originalSizeBytes, asset.getWidth(), asset.getHeight(), asset.getCreatedAt()
        );
    }
}
