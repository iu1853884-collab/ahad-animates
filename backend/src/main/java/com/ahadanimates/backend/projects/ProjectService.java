package com.ahadanimates.backend.projects;

import com.ahadanimates.backend.common.exception.ResourceNotFoundException;
import com.ahadanimates.backend.projects.dto.ProjectRequest;
import com.ahadanimates.backend.projects.dto.ProjectResponse;
import com.ahadanimates.backend.projects.dto.ProjectStatusRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listForAdmin(String category, ProjectStatus status) {
        String normalizedCategory = category == null || category.isBlank() ? null : category.trim();
        return projectRepository.findForAdmin(normalizedCategory, status)
                .stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listPublished() {
        return projectRepository.findAllByStatusOrderByCreatedAtDesc(ProjectStatus.PUBLISHED)
                .stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getForAdmin(Long id) {
        return ProjectResponse.from(findById(id));
    }

    @Transactional(readOnly = true)
    public ProjectResponse getPublishedBySlug(String slug) {
        Project project = projectRepository.findBySlugAndStatus(slug, ProjectStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        return ProjectResponse.from(project);
    }

    public ProjectResponse create(ProjectRequest request) {
        ensureSlugAvailable(request.slug(), null);
        Project project = new Project(
                request.title().trim(),
                request.slug().trim(),
                normalizeOptionalText(request.description()),
                request.category().trim(),
                request.thumbnailUrl().trim(),
                request.projectUrl().trim(),
                normalizeOptionalText(request.videoUrl()),
                request.featured(),
                request.status()
        );
        return ProjectResponse.from(projectRepository.save(project));
    }

    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = findById(id);
        ensureSlugAvailable(request.slug(), id);
        project.setTitle(request.title().trim());
        project.setSlug(request.slug().trim());
        project.setDescription(normalizeOptionalText(request.description()));
        project.setCategory(request.category().trim());
        project.setThumbnailUrl(request.thumbnailUrl().trim());
        project.setProjectUrl(request.projectUrl().trim());
        project.setVideoUrl(normalizeOptionalText(request.videoUrl()));
        project.setFeatured(request.featured());
        project.setStatus(request.status());
        return ProjectResponse.from(projectRepository.save(project));
    }

    public ProjectResponse updateStatus(Long id, ProjectStatusRequest request) {
        Project project = findById(id);
        project.setStatus(request.status());
        return ProjectResponse.from(projectRepository.save(project));
    }

    public void delete(Long id) {
        projectRepository.delete(findById(id));
    }

    private Project findById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private void ensureSlugAvailable(String slug, Long currentProjectId) {
        projectRepository.findBySlug(slug.trim())
                .filter(project -> !project.getId().equals(currentProjectId))
                .ifPresent(project -> {
                    throw new ProjectSlugConflictException("A project with this slug already exists");
                });
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
