package com.ahadanimates.backend.projects.dto;

import com.ahadanimates.backend.projects.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record ProjectStatusRequest(@NotNull ProjectStatus status) {
}
