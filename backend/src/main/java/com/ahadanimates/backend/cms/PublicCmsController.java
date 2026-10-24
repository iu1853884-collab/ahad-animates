package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.cms.dto.ContentResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/cms/{section}")
public class PublicCmsController {

    private final CmsContentService service;

    public PublicCmsController(CmsContentService service) {
        this.service = service;
    }

    @GetMapping
    public List<ContentResponse> list(@PathVariable String section) {
        return service.listPublished(ContentType.fromRoute(section));
    }

    @GetMapping("/{slug}")
    public ContentResponse get(@PathVariable String section, @PathVariable String slug) {
        return service.getPublished(ContentType.fromRoute(section), slug);
    }
}
