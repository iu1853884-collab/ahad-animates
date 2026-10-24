package com.ahadanimates.backend.config;

import com.ahadanimates.backend.projects.Project;
import com.ahadanimates.backend.projects.ProjectRepository;
import com.ahadanimates.backend.projects.ProjectStatus;
import com.ahadanimates.backend.projects.PortfolioSeedState;
import com.ahadanimates.backend.projects.PortfolioSeedStateRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PortfolioDataInitializer implements CommandLineRunner {

    private final ProjectRepository projectRepository;
    private final PortfolioSeedStateRepository seedStateRepository;

    public PortfolioDataInitializer(
            ProjectRepository projectRepository,
            PortfolioSeedStateRepository seedStateRepository
    ) {
        this.projectRepository = projectRepository;
        this.seedStateRepository = seedStateRepository;
    }

    @Override
    public void run(String... args) {
        String seedId = "existing-portfolio-v1";
        if (!seedStateRepository.existsById(seedId)) {
            if (projectRepository.count() == 0) {
                projectRepository.saveAll(List.of(
                    new Project(
                            "Luxury Perfume Product Visualization",
                            "luxury-perfume",
                            null,
                            "3D Product Visualization",
                            "https://mir-s3-cdn-cf.behance.net/projects/404/489cea254818835.Y3JvcCw0NDAsMzQ0LDQ2MywyMTE.png",
                            "https://www.behance.net/gallery/254818835/Luxury-Perfume-Product-Visualization",
                            null,
                            false,
                            ProjectStatus.PUBLISHED
                    ),
                    new Project(
                            "Dior Loop",
                            "dior-loop",
                            null,
                            "3D Luxury Perfume Animation",
                            "https://mir-s3-cdn-cf.behance.net/projects/404/4cc663252488721.Y3JvcCw0MzEsMzM3LDQ2NywxMTI.png",
                            "https://www.behance.net/gallery/252488721/Dior-Loop-3D-Luxury-Perfume-Animation-in-Blender",
                            null,
                            false,
                            ProjectStatus.PUBLISHED
                    ),
                    new Project(
                            "Shilajit Gummies",
                            "shilajit-gummies",
                            null,
                            "3D Modeling & Product Visualization",
                            "https://mir-s3-cdn-cf.behance.net/projects/404/eef0ba252451787.Y3JvcCw0MzQsMzQwLDQ2NCwxODc.png",
                            "https://www.behance.net/gallery/252451787/Shilajit-Gummies-3D-Modeling-Product-Visualization",
                            null,
                            false,
                            ProjectStatus.PUBLISHED
                    ),
                    new Project(
                            "Taar Type C-C Cable",
                            "taar-cable",
                            null,
                            "3D Modeling & Visualization",
                            "https://mir-s3-cdn-cf.behance.net/projects/404/968c27251817145.Y3JvcCw0MzQsMzQwLDQ2NSwxODA.png",
                            "https://www.behance.net/gallery/251817145/Taar-Type-C-C-Cable-3D-Modeling-Visualization",
                            null,
                            false,
                            ProjectStatus.PUBLISHED
                    ),
                    new Project(
                            "Samsung Galaxy S26 Ultra",
                            "samsung-s26-ultra",
                            null,
                            "3D Modeling & Visualization",
                            "/images/samsung-placeholder.svg",
                            "https://www.behance.net/gallery/244279629/Samsung-Galaxy-S26-Ultra-3D-Modeling-Visualization",
                            null,
                            false,
                            ProjectStatus.PUBLISHED
                    )
                ));
            }
            seedStateRepository.save(new PortfolioSeedState(seedId));
        }

        String additionalProjectsSeedId = "verified-additional-portfolio-v1";
        if (!seedStateRepository.existsById(additionalProjectsSeedId)) {
            addProjectIfMissing(new Project(
                    "3D Products Visualization & Render in Blender",
                    "products-visualization-blender",
                    null,
                    "3D Product Visualization",
                    "https://mir-s3-cdn-cf.behance.net/projects/404/a6a61d251139895.Y3JvcCw5ODEsNzY4LDAsMA.png",
                    "https://www.behance.net/gallery/251139895/3D-Products-Visualization-Render-in-Blender",
                    null,
                    false,
                    ProjectStatus.PUBLISHED
            ));
            addProjectIfMissing(new Project(
                    "Premium Fragrance CGI | 3D Visualization in Blender",
                    "premium-fragrance-cgi",
                    null,
                    "3D Product Visualization",
                    "https://mir-s3-cdn-cf.behance.net/projects/404/daa4ea249837095.Y3JvcCw0MjksMzM1LDQ2NSwxNDc.png",
                    "https://www.behance.net/gallery/249837095/Premium-Fragrance-CGI-3D-Visualization-in-Blender",
                    null,
                    false,
                    ProjectStatus.PUBLISHED
            ));
            seedStateRepository.save(new PortfolioSeedState(additionalProjectsSeedId));
        }

        String cinematicProjectSeedId = "verified-cinematic-portfolio-v1";
        if (!seedStateRepository.existsById(cinematicProjectSeedId)) {
            addProjectIfMissing(new Project(
                    "Cinematic Perfume Visualization in Blender",
                    "cinematic-perfume-visualization",
                    null,
                    "3D Product Visualization",
                    "https://mir-s3-cdn-cf.behance.net/projects/404/dba1ea250878395.Y3JvcCw0MzQsMzQwLDQ2NSwyMTQ.png",
                    "https://www.behance.net/gallery/250878395/Cinematic-Perfume-Visualization-in-Blender",
                    null,
                    false,
                    ProjectStatus.PUBLISHED
            ));
            seedStateRepository.save(new PortfolioSeedState(cinematicProjectSeedId));
        }
    }

    private void addProjectIfMissing(Project project) {
        if (!projectRepository.existsBySlug(project.getSlug())) {
            projectRepository.save(project);
        }
    }
}
