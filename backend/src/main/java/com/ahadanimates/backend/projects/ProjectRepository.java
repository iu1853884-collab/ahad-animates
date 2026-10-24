package com.ahadanimates.backend.projects;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsBySlug(String slug);

    Optional<Project> findBySlug(String slug);

    @Query("""
            SELECT project FROM Project project
            WHERE (:category IS NULL OR project.category = :category)
              AND (:status IS NULL OR project.status = :status)
            ORDER BY project.createdAt DESC
            """)
    List<Project> findForAdmin(
            @Param("category") String category,
            @Param("status") ProjectStatus status
    );

    List<Project> findAllByStatusOrderByCreatedAtDesc(ProjectStatus status);

    Optional<Project> findBySlugAndStatus(String slug, ProjectStatus status);

    @Query("""
            SELECT CASE WHEN COUNT(project) > 0 THEN true ELSE false END
            FROM Project project
            WHERE (:status IS NULL OR project.status = :status)
              AND (project.thumbnailUrl LIKE CONCAT('%', :path)
                   OR project.videoUrl LIKE CONCAT('%', :path))
            """)
    boolean existsPublishedReference(@Param("path") String path, @Param("status") ProjectStatus status);

    @Query("""
            SELECT CASE WHEN COUNT(project) > 0 THEN true ELSE false END
            FROM Project project
            WHERE project.thumbnailUrl LIKE CONCAT('%', :path)
               OR project.videoUrl LIKE CONCAT('%', :path)
            """)
    boolean existsAnyReference(@Param("path") String path);
}
