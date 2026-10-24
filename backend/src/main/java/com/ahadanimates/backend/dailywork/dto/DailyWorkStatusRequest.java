package com.ahadanimates.backend.dailywork.dto;

import com.ahadanimates.backend.projects.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record DailyWorkStatusRequest(@NotNull ProjectStatus status) {
}
