"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import { portfolioProjects, filterCategories } from "@/data/portfolio";
import { Project, ProjectFilterCategory } from "@/types";
import { apiGetPublicProjects, ProjectRecord } from "@/lib/api";
import { hasSafeVideoUrl } from "@/lib/video";

export function PortfolioSection({
  fallbackToStatic = true,
}: {
  fallbackToStatic?: boolean;
}) {
  const [activeFilter, setActiveFilter] =
    useState<ProjectFilterCategory>("All");
  const [projects, setProjects] = useState<Project[]>(portfolioProjects);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiGetPublicProjects()
      .then((records) => {
        if (isMounted) {
          setProjects(records.map(toPortfolioProject));
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load the live portfolio."
          );
          setProjects(fallbackToStatic ? portfolioProjects : []);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackToStatic]);

  const categories = useMemo(
    () =>
      projects.length
        ? ["All", ...new Set(projects.map((project) => project.filterCategory))]
        : filterCategories,
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const filtered =
      activeFilter === "All"
        ? projects
        : projects.filter(
            (project) => project.filterCategory === activeFilter
          );

    return [...filtered].sort((a, b) => {
      const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      if (featuredDelta !== 0) return featuredDelta;
      return 0;
    });
  }, [activeFilter, projects]);

  return (
    <section
      id="work"
      className="relative mx-auto max-w-7xl px-6 py-24 md:px-12"
    >
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-violet-400 uppercase">
            SELECTED PROJECTS
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Real work
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
            Product visualization and 3D work from the public Ahad Animates
            portfolio. Open a case study for details, or visit the verified
            Behance showcase.
          </p>
        </div>

        <a
          href="https://www.youtube.com/playlist?list=PLczqtsQOvnA65AbQnMPA3bA5nBQamDslu"
          target="_blank"
          rel="noopener noreferrer"
          className="aa-button aa-button-secondary rounded-full px-6 py-3.5 text-xs tracking-wider"
          aria-label="Watch Ahad Animates tutorials playlist on YouTube in a new tab"
        >
          <span>Watch tutorials</span>
          <ExternalLink size={14} className="text-violet-400" />
        </a>
      </div>

      {loadError && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-sm text-amber-200"
        >
        {fallbackToStatic
          ? "Live projects could not be reached. Showing the existing verified portfolio while the connection recovers."
          : "Live projects are unavailable right now. Please try again later."}
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-2.5" role="tablist" aria-label="Portfolio filters">
        {categories.map((cat) => {
          const isActive = activeFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(cat)}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95 ${
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:border-violet-400/40 hover:text-white"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <motion.div
        layout
        className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {loading && (
          <p className="col-span-full py-12 text-center text-sm text-zinc-400" role="status">
            Loading selected projects…
          </p>
        )}
        {!loading && filteredProjects.length === 0 && (
          <p className="col-span-full rounded-2xl border border-white/10 bg-white/[0.025] py-12 text-center text-sm text-zinc-400">
            No published projects in this category yet.
          </p>
        )}
        <AnimatePresence mode="popLayout">
          {!loading &&
            filteredProjects.map((project, index) => {
              const showVideoCue = hasSafeVideoUrl(project.videoUrl);
              return (
                <motion.article
                  layout
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className={`group flex flex-col overflow-hidden rounded-2xl border bg-white/[0.025] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-600/10 focus-within:border-violet-400 ${
                    project.featured
                      ? "border-violet-400/45 bg-gradient-to-br from-violet-500/[0.07] to-white/[0.02] ring-1 ring-violet-400/20 lg:col-span-2"
                      : "border-white/10 hover:border-violet-400/60"
                  }`}
                >
                  <Link
                    href={`/portfolio/${project.id}`}
                    className="flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-2xl"
                    aria-label={`Open case study for ${project.title}`}
                  >
                    <div
                      className={`relative w-full overflow-hidden bg-zinc-950 ${
                        project.featured
                          ? "aspect-[4/5] md:aspect-[16/10]"
                          : "aspect-[4/5]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.image}
                        alt={project.imageAlt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {project.featured && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/45 bg-black/75 px-3 py-1 text-[11px] font-medium text-violet-200 backdrop-blur-md shadow-md">
                              <Sparkles size={12} className="text-violet-300 shrink-0" />
                              Featured
                            </span>
                          )}
                          {showVideoCue && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/75 px-3 py-1 text-[11px] font-medium text-zinc-100 backdrop-blur-md shadow-md">
                              <PlayCircle size={12} className="text-violet-300 shrink-0" />
                              Video
                            </span>
                          )}
                        </div>

                        {project.isPlaceholder ? (
                          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-black/75 px-3 py-1 text-[11px] font-medium text-amber-300 backdrop-blur-md shadow-md">
                            <AlertCircle
                              size={12}
                              className="text-amber-400 shrink-0"
                            />
                            <span>{project.statusBadge || "Placeholder"}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-black/75 px-3 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-md shadow-md">
                            <ShieldCheck
                              size={12}
                              className="text-emerald-400 shrink-0"
                            />
                            <span>Verified Showcase</span>
                          </div>
                        )}
                      </div>

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08080b] via-transparent to-transparent opacity-65 transition-opacity duration-300 group-hover:opacity-45" />
                    </div>

                    <div className="flex flex-col flex-1 justify-between p-6">
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">
                          {project.category}
                        </p>
                        <h3 className="text-lg font-bold leading-snug text-white transition-colors duration-200 group-hover:text-violet-200">
                          {project.title}
                        </h3>
                        {project.description && (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">
                            {project.description}
                          </p>
                        )}

                        {project.tags && project.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-400 border border-white/[0.06]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4 text-xs font-semibold text-zinc-400 transition-colors group-hover:text-white">
                        <span className="portfolio-card-cta">
                          View case study
                        </span>
                        <ArrowUpRight
                          size={16}
                          className="text-violet-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                        />
                      </div>
                    </div>
                  </Link>

                  <div className="border-t border-white/[0.06] px-6 py-3">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aa-button aa-button-secondary min-h-9 rounded-full px-3 py-2 text-[10px] uppercase tracking-wider"
                      aria-label={`Open ${project.title} on Behance (opens in a new tab)`}
                    >
                      View on Behance
                      <ExternalLink size={12} className="text-violet-400" />
                    </a>
                  </div>
                </motion.article>
              );
            })}
        </AnimatePresence>
      </motion.div>

      <div className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Case studies open on this site. Verified Behance showcase links remain
          available on every card.
        </p>
      </div>
    </section>
  );
}

function toPortfolioProject(record: ProjectRecord): Project {
  const verifiedProject = portfolioProjects.find(
    (project) => project.id === record.slug
  );

  return {
    id: record.slug,
    title: record.title,
    description: record.description,
    category: verifiedProject?.category ?? record.category,
    filterCategory: verifiedProject?.filterCategory ?? record.category,
    image: record.thumbnailUrl,
    imageAlt: verifiedProject?.imageAlt ?? `${record.title} project thumbnail`,
    url: record.projectUrl,
    videoUrl: record.videoUrl,
    featured: record.featured,
    isPlaceholder: verifiedProject?.isPlaceholder,
    statusBadge: verifiedProject?.statusBadge,
    tags: verifiedProject?.tags ?? [],
  };
}
