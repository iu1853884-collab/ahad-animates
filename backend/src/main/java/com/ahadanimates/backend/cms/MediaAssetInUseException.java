package com.ahadanimates.backend.cms;

public class MediaAssetInUseException extends RuntimeException {
    public MediaAssetInUseException(String message) {
        super(message);
    }
}
