package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.common.exception.ResourceNotFoundException;
import com.ahadanimates.backend.cms.dto.ContentRequest;
import com.ahadanimates.backend.cms.dto.ContentResponse;
import com.ahadanimates.backend.projects.ProjectStatus;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@Transactional
public class CmsContentService {

    private static final Safelist ARTICLE_HTML = Safelist.relaxed()
            .addAttributes("a", "target", "rel")
            .addProtocols("a", "href", "http", "https", "mailto")
            .addProtocols("img", "src", "http", "https");

    private final ContentRepository repository;

    public CmsContentService(ContentRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ContentResponse> listAdmin(ContentType type, ProjectStatus status) {
        List<ContentItem> entries = status == null
                ? repository.findAllByContentTypeOrderByUpdatedAtDesc(type)
                : repository.findAllByContentTypeAndStatusOrderByDisplayOrderAscPublicationDateDesc(type, status);
        return entries.stream().map(ContentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ContentResponse> listPublished(ContentType type) {
        return repository.findAllByContentTypeAndStatusOrderByDisplayOrderAscPublicationDateDesc(
                        type, ProjectStatus.PUBLISHED)
                .stream().map(ContentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ContentResponse getAdmin(ContentType type, Long id) {
        return ContentResponse.from(find(type, id));
    }

    @Transactional(readOnly = true)
    public ContentResponse getPublished(ContentType type, String slug) {
        ContentItem item = repository.findByContentTypeAndSlugAndStatus(type, slug, ProjectStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));
        return ContentResponse.from(item);
    }

    public ContentResponse create(ContentType type, ContentRequest request) {
        ensureValidForType(type, request);
        String slug = request.slug().trim();
        ensureSlugAvailable(type, slug, null);
        ContentItem item = new ContentItem(
                type, request.title().trim(), slug, request.category().trim(), request.status());
        apply(item, request);
        return ContentResponse.from(repository.save(item));
    }

    public ContentResponse update(ContentType type, Long id, ContentRequest request) {
        ensureValidForType(type, request);
        ContentItem item = find(type, id);
        String slug = request.slug().trim();
        ensureSlugAvailable(type, slug, id);
        item.update(
                request.title().trim(), slug, normalize(request.description()), normalize(request.excerpt()),
                normalize(request.coverImageUrl()), sanitizeHtml(request.body()), normalize(request.videoSource()),
                request.category().trim(), normalizeTags(request.tags()), normalize(request.author()),
                request.publicationDate(), normalize(request.thumbnailUrl()), normalize(request.mediaUrl()),
                request.mediaType(), request.displayOrder(), request.status()
        );
        return ContentResponse.from(repository.save(item));
    }

    private void apply(ContentItem item, ContentRequest request) {
        item.update(
                request.title().trim(), request.slug().trim(), normalize(request.description()),
                normalize(request.excerpt()), normalize(request.coverImageUrl()), sanitizeHtml(request.body()),
                normalize(request.videoSource()), request.category().trim(), normalizeTags(request.tags()),
                normalize(request.author()), request.publicationDate(), normalize(request.thumbnailUrl()),
                normalize(request.mediaUrl()), request.mediaType(), request.displayOrder(), request.status()
        );
    }

    public ContentResponse updateStatus(ContentType type, Long id, ProjectStatus status) {
        ContentItem item = find(type, id);
        item.setStatus(status);
        validatePublishedRequirements(item);
        return ContentResponse.from(repository.save(item));
    }

    public void delete(ContentType type, Long id) {
        repository.delete(find(type, id));
    }

    private ContentItem find(ContentType type, Long id) {
        return repository.findById(id)
                .filter(item -> item.getContentType() == type)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));
    }

    private void ensureSlugAvailable(ContentType type, String slug, Long currentId) {
        boolean exists = currentId == null
                ? repository.existsByContentTypeAndSlug(type, slug)
                : repository.existsByContentTypeAndSlugAndIdNot(type, slug, currentId);
        if (exists) throw new ContentSlugConflictException();
    }

    private void ensureValidForType(ContentType type, ContentRequest request) {
        validateUrl(request.coverImageUrl(), "Cover image URL");
        validateUrl(request.thumbnailUrl(), "Thumbnail URL");
        validateUrl(request.videoSource(), "Video URL");
        validateUrl(request.mediaUrl(), "Media URL");
        if (type == ContentType.TUTORIALS && isBlank(request.videoSource())) {
            throw new InvalidMediaException("Tutorials need an external video URL or uploaded video");
        }
        if (type == ContentType.ADS_VIDEOS) {
            if (isBlank(request.mediaUrl()) || request.mediaType() == null) {
                throw new InvalidMediaException("Ads and videos need a media URL and media type");
            }
            if (request.mediaType() == MediaType.VIDEO && isBlank(request.thumbnailUrl())) {
                throw new InvalidMediaException("Video gallery items need a poster image URL");
            }
        }
        if (type == ContentType.BLOGS
                && (isBlank(request.excerpt()) || isBlank(request.body()) || isBlank(request.author()))) {
            throw new InvalidMediaException("Blogs need an excerpt, article body, and author");
        }
        if (request.status() == ProjectStatus.PUBLISHED
                && type == ContentType.BLOGS && request.publicationDate() == null) {
            throw new InvalidMediaException("Published blogs need a publication date");
        }
    }

    private void validatePublishedRequirements(ContentItem item) {
        if (item.getContentType() == ContentType.TUTORIALS && isBlank(item.getVideoSource())) {
            throw new InvalidMediaException("A tutorial needs a video source before publishing");
        }
        if (item.getContentType() == ContentType.ADS_VIDEOS
                && (isBlank(item.getMediaUrl()) || item.getMediaType() == null
                || item.getMediaType() == MediaType.VIDEO && isBlank(item.getThumbnailUrl()))) {
            throw new InvalidMediaException("An ad needs a media URL and a poster image for video before publishing");
        }
        if (item.getContentType() == ContentType.BLOGS
                && (item.getPublicationDate() == null || isBlank(item.getBody()) || isBlank(item.getAuthor()))) {
            throw new InvalidMediaException("A blog needs an author, publication date, and article body before publishing");
        }
    }

    private void validateUrl(String value, String field) {
        if (isBlank(value)) return;
        try {
            URI uri = URI.create(value.trim());
            String scheme = uri.getScheme();
            if (uri.getHost() == null || uri.getUserInfo() != null
                    || !("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException exception) {
            throw new InvalidMediaException(field + " must be an HTTP or HTTPS URL");
        }
    }

    private String normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) return null;
        return tags.stream().filter(Objects::nonNull).map(String::trim)
                .filter(tag -> !tag.isEmpty()).distinct().reduce((left, right) -> left + "\n" + right).orElse(null);
    }

    private String sanitizeHtml(String html) {
        if (isBlank(html)) return null;
        return Jsoup.clean(html, ARTICLE_HTML);
    }

    private String normalize(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
