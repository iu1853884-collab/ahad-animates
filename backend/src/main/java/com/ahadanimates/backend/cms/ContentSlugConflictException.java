package com.ahadanimates.backend.cms;

public class ContentSlugConflictException extends RuntimeException {
    public ContentSlugConflictException() {
        super("Content with this slug already exists in this section");
    }
}
