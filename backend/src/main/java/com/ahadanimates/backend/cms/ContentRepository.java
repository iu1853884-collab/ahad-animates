package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.projects.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ContentRepository extends JpaRepository<ContentItem, Long> {
    List<ContentItem> findAllByContentTypeOrderByUpdatedAtDesc(ContentType contentType);
    List<ContentItem> findAllByContentTypeAndStatusOrderByDisplayOrderAscPublicationDateDesc(
            ContentType contentType, ProjectStatus status);
    Optional<ContentItem> findByContentTypeAndSlug(ContentType contentType, String slug);
    Optional<ContentItem> findByContentTypeAndSlugAndStatus(
            ContentType contentType, String slug, ProjectStatus status);
    boolean existsByContentTypeAndSlug(ContentType contentType, String slug);
    boolean existsByContentTypeAndSlugAndIdNot(ContentType contentType, String slug, Long id);

    @Query("""
            SELECT CASE WHEN COUNT(content) > 0 THEN true ELSE false END
            FROM ContentItem content
            WHERE content.status = :status
              AND (content.coverImageUrl LIKE CONCAT('%', :path)
                   OR content.thumbnailUrl LIKE CONCAT('%', :path)
                   OR content.mediaUrl LIKE CONCAT('%', :path)
                   OR content.videoSource LIKE CONCAT('%', :path))
            """)
    boolean existsPublishedReference(@Param("path") String path, @Param("status") ProjectStatus status);

    @Query("""
            SELECT CASE WHEN COUNT(content) > 0 THEN true ELSE false END
            FROM ContentItem content
            WHERE content.coverImageUrl LIKE CONCAT('%', :path)
               OR content.thumbnailUrl LIKE CONCAT('%', :path)
               OR content.mediaUrl LIKE CONCAT('%', :path)
               OR content.videoSource LIKE CONCAT('%', :path)
            """)
    boolean existsAnyReference(@Param("path") String path);
}
