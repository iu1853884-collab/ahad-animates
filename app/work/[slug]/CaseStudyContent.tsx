"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { apiGetPublicProject, type ProjectRecord } from "@/lib/api";
import { ProjectVideo } from "@/components/portfolio/ProjectVideo";
import { hasSafeVideoUrl } from "@/lib/video";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; slug: string; project: ProjectRecord }
  | { status: "not-found"; slug: string }
  | { status: "error"; slug: string; message: string };

export default function CaseStudyContent() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    apiGetPublicProject(slug)
      .then((project) => {
        if (isMounted) setState({ status: "ready", slug, project });
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : "Unable to load this project.";
        if (/not found/i.test(message) || /404/.test(message)) {
          setState({ status: "not-found", slug });
          return;
        }
        setState({ status: "error", slug, message });
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!slug || state.status === "loading" || state.slug !== slug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080b] px-6 text-white">
        <p className="text-sm text-zinc-400" role="status">
          Loading case study...
        </p>
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080b] px-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Project not found</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            This case study is unavailable, unpublished, or the link is incorrect.
          </p>
          <Link
            href="/portfolio"
            className="aa-button aa-button-secondary mt-8 rounded-full px-5 py-2.5 text-xs uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Back to portfolio
          </Link>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080b] px-6 text-white">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <AlertCircle size={22} />
          </div>
          <h1 className="text-2xl font-semibold">Unable to load case study</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{state.message}</p>
          <Link
            href="/portfolio"
            className="aa-button aa-button-secondary mt-8 rounded-full px-5 py-2.5 text-xs uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Back to portfolio
          </Link>
        </div>
      </main>
    );
  }

  const { project } = state;
  const showVideo = hasSafeVideoUrl(project.videoUrl);

  return (
    <main className="min-h-screen bg-[#08080b] text-white">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-[10%] top-[-5%] h-[420px] w-[420px] rounded-full bg-violet-700/10 blur-[140px]" />
        <div className="absolute right-[-8%] top-[18%] h-[480px] w-[480px] rounded-full bg-fuchsia-700/10 blur-[160px]" />
      </div>

      <article className="relative z-10 mx-auto max-w-5xl px-6 py-12 md:px-12 md:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-violet-300">
          {project.category}
          {project.featured ? " · Featured" : ""}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
          {project.title}
        </h1>

        {project.description ? (
          <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            {project.description}
          </p>
        ) : (
          <p className="mt-6 max-w-3xl text-sm leading-6 text-zinc-500">
            No written case-study description has been published for this project yet.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={project.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="aa-button aa-button-primary rounded-full px-6 py-3 text-xs uppercase tracking-wider"
          >
            View verified showcase
            <ExternalLink size={14} />
          </a>
          <Link
            href="/portfolio"
            className="aa-button aa-button-secondary rounded-full px-6 py-3 text-xs uppercase tracking-wider"
          >
            More projects
          </Link>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.thumbnailUrl}
            alt={`${project.title} project thumbnail`}
            className="aspect-[16/10] w-full object-cover"
          />
        </div>

        {showVideo && (
          <section className="mt-12" aria-labelledby="video-showcase-heading">
            <h2
              id="video-showcase-heading"
              className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400"
            >
              Video showcase
            </h2>
            <div className="mt-4">
              <ProjectVideo
                videoUrl={project.videoUrl}
                title={project.title}
                posterUrl={project.thumbnailUrl}
              />
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
