package com.ahadanimates.backend.projects;

public class ProjectSlugConflictException extends RuntimeException {
    public ProjectSlugConflictException(String message) {
        super(message);
    }
}
