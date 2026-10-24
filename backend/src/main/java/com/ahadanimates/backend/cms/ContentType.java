package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.common.exception.ResourceNotFoundException;

public enum ContentType {
    TUTORIALS,
    ADS_VIDEOS,
    BLOGS;

    public static ContentType fromRoute(String value) {
        return switch (value.toLowerCase()) {
            case "tutorials" -> TUTORIALS;
            case "ads-videos" -> ADS_VIDEOS;
            case "blogs" -> BLOGS;
            default -> throw new ResourceNotFoundException("Content section not found");
        };
    }

    public String toRoute() {
        return switch (this) {
            case TUTORIALS -> "tutorials";
            case ADS_VIDEOS -> "ads-videos";
            case BLOGS -> "blogs";
        };
    }
}
