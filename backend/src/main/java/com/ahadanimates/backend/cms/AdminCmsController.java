package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.cms.dto.ContentRequest;
import com.ahadanimates.backend.cms.dto.ContentResponse;
import com.ahadanimates.backend.cms.dto.ContentStatusRequest;
import com.ahadanimates.backend.projects.ProjectStatus;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/cms/{section}")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminCmsController {

    private final CmsContentService service;

    public AdminCmsController(CmsContentService service) {
        this.service = service;
    }

    @GetMapping
    public List<ContentResponse> list(@PathVariable String section,
                                      @RequestParam(required = false) ProjectStatus status) {
        return service.listAdmin(ContentType.fromRoute(section), status);
    }

    @GetMapping("/{id}")
    public ContentResponse get(@PathVariable String section, @PathVariable Long id) {
        return service.getAdmin(ContentType.fromRoute(section), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContentResponse create(@PathVariable String section, @Valid @RequestBody ContentRequest request) {
        return service.create(ContentType.fromRoute(section), request);
    }

    @PutMapping("/{id}")
    public ContentResponse update(@PathVariable String section, @PathVariable Long id,
                                  @Valid @RequestBody ContentRequest request) {
        return service.update(ContentType.fromRoute(section), id, request);
    }

    @PatchMapping("/{id}/status")
    public ContentResponse updateStatus(@PathVariable String section, @PathVariable Long id,
                                        @Valid @RequestBody ContentStatusRequest request) {
        return service.updateStatus(ContentType.fromRoute(section), id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String section, @PathVariable Long id) {
        service.delete(ContentType.fromRoute(section), id);
    }
}
