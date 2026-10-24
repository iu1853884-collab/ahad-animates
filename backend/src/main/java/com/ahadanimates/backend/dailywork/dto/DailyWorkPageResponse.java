package com.ahadanimates.backend.dailywork.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record DailyWorkPageResponse(
        List<DailyWorkResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages,
        boolean first,
        boolean last,
        List<String> categories
) {
    public static DailyWorkPageResponse from(Page<DailyWorkResponse> page, List<String> categories) {
        return new DailyWorkPageResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                categories
        );
    }
}
