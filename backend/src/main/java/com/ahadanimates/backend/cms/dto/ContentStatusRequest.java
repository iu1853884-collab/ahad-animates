package com.ahadanimates.backend.cms.dto;

import com.ahadanimates.backend.projects.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record ContentStatusRequest(@NotNull ProjectStatus status) {
}
