import { Project, ProjectFilterCategory } from "@/types";

export const filterCategories: ProjectFilterCategory[] = [
  "All",
  "Product Visualization",
  "Animation",
  "Hard Surface",
];

export const portfolioProjects: Project[] = [
  {
    id: "luxury-perfume",
    title: "Luxury Perfume Product Visualization",
    category: "3D Product Visualization",
    filterCategory: "Product Visualization",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/489cea254818835.Y3JvcCw0NDAsMzQ0LDQ2MywyMTE.png",
    imageAlt: "Luxury perfume bottle frozen in ice block 3D product render",
    url: "https://www.behance.net/gallery/254818835/Luxury-Perfume-Product-Visualization",
    tags: ["Blender", "Lighting", "Subsurface Scattering"],
  },
  {
    id: "dior-loop",
    title: "Dior Loop",
    category: "3D Luxury Perfume Animation",
    filterCategory: "Animation",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/4cc663252488721.Y3JvcCw0MzEsMzM3LDQ2NywxMTI.png",
    imageAlt:
      "Dior Sauvage perfume bottle moving along roller coaster track animation render",
    url: "https://www.behance.net/gallery/252488721/Dior-Loop-3D-Luxury-Perfume-Animation-in-Blender",
    tags: ["Blender", "Motion Design", "Commercial CGI"],
  },
  {
    id: "shilajit-gummies",
    title: "Shilajit Gummies",
    category: "3D Modeling & Product Visualization",
    filterCategory: "Product Visualization",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/eef0ba252451787.Y3JvcCw0MzQsMzQwLDQ2NCwxODc.png",
    imageAlt:
      "Sukoon Shilajit Gummies dietary supplement bottle 3D product render",
    url: "https://www.behance.net/gallery/252451787/Shilajit-Gummies-3D-Modeling-Product-Visualization",
    tags: ["Product Modeling", "Label Texturing", "Studio Renders"],
  },
  {
    id: "taar-cable",
    title: "Taar Type C-C Cable",
    category: "3D Modeling & Visualization",
    filterCategory: "Hard Surface",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/968c27251817145.Y3JvcCw0MzQsMzQwLDQ2NSwxODA.png",
    imageAlt:
      "Taar braided Type C to Type C cable connector 3D model render",
    url: "https://www.behance.net/gallery/251817145/Taar-Type-C-C-Cable-3D-Modeling-Visualization",
    tags: ["Hard Surface", "Braided Shader", "Industrial Design"],
  },
  {
    id: "samsung-s26-ultra",
    title: "Samsung Galaxy S26 Ultra",
    category: "3D Modeling & Visualization",
    filterCategory: "Hard Surface",
    image: "/images/samsung-placeholder.svg",
    imageAlt:
      "Samsung Galaxy S26 Ultra 3D visualization placeholder preview",
    url: "https://www.behance.net/gallery/244279629/Samsung-Galaxy-S26-Ultra-3D-Modeling-Visualization",
    isPlaceholder: true,
    statusBadge: "Thumbnail Pending Verification",
    tags: ["Concept Model", "Behance Verified", "High Poly"],
  },
  {
    id: "products-visualization-blender",
    title: "3D Products Visualization & Render in Blender",
    category: "3D Product Visualization",
    filterCategory: "Product Visualization",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/a6a61d251139895.Y3JvcCw5ODEsNzY4LDAsMA.png",
    imageAlt: "3D Products Visualization & Render in Blender",
    url: "https://www.behance.net/gallery/251139895/3D-Products-Visualization-Render-in-Blender",
    tags: [],
  },
  {
    id: "premium-fragrance-cgi",
    title: "Premium Fragrance CGI | 3D Visualization in Blender",
    category: "3D Product Visualization",
    filterCategory: "Product Visualization",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/daa4ea249837095.Y3JvcCw0MjksMzM1LDQ2NSwxNDc.png",
    imageAlt: "Premium Fragrance CGI | 3D Visualization in Blender",
    url: "https://www.behance.net/gallery/249837095/Premium-Fragrance-CGI-3D-Visualization-in-Blender",
    tags: [],
  },
  {
    id: "cinematic-perfume-visualization",
    title: "Cinematic Perfume Visualization in Blender",
    category: "3D Product Visualization",
    filterCategory: "Product Visualization",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/dba1ea250878395.Y3JvcCw0MzQsMzQwLDQ2NSwyMTQ.png",
    imageAlt: "Cinematic Perfume Visualization in Blender",
    url: "https://www.behance.net/gallery/250878395/Cinematic-Perfume-Visualization-in-Blender",
    tags: [],
  },
];
