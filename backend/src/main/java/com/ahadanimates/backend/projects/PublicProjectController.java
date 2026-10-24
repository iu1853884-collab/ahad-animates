package com.ahadanimates.backend.projects;

import com.ahadanimates.backend.projects.dto.ProjectResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/projects")
public class PublicProjectController {

    private final ProjectService projectService;

    public PublicProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<ProjectResponse> listPublished() {
        return projectService.listPublished();
    }

    @GetMapping("/{slug}")
    public ProjectResponse getPublished(@PathVariable String slug) {
        return projectService.getPublishedBySlug(slug);
    }
}
