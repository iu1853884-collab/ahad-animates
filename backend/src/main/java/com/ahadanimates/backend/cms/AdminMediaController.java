package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.cms.dto.MediaAssetResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;

import java.util.List;

@RestController
@RequestMapping("/api/admin/media")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminMediaController {

    private final MediaUploadService mediaUploadService;

    public AdminMediaController(MediaUploadService mediaUploadService) {
        this.mediaUploadService = mediaUploadService;
    }

    @GetMapping
    public List<MediaAssetResponse> listRecent() {
        return mediaUploadService.listRecent();
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> preview(@PathVariable Long id) {
        MediaUploadService.StoredMedia media = mediaUploadService.getFile(id, true);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(media.contentType()))
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore().cachePrivate())
                .body(media.resource());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MediaAssetResponse upload(@RequestPart("file") MultipartFile file) {
        return mediaUploadService.upload(file);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        mediaUploadService.delete(id);
    }
}
