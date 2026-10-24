"use client";

import { ExternalLink } from "lucide-react";
import { parseSafeVideoUrl } from "@/lib/video";

interface ProjectVideoProps {
  videoUrl: string | null | undefined;
  title: string;
  posterUrl?: string | null;
  className?: string;
}

/**
 * Renders a safe YouTube/Vimeo embed or native HTML5 video.
 * Returns null when no supported video URL is available.
 */
export function ProjectVideo({
  videoUrl,
  title,
  posterUrl,
  className = "",
}: ProjectVideoProps) {
  const video = parseSafeVideoUrl(videoUrl);
  if (!video) return null;

  if (video.kind === "file") {
    return (
      <div className={`overflow-hidden rounded-2xl border border-white/10 bg-black ${className}`}>
        <video
          controls
          preload="metadata"
          playsInline
          poster={posterUrl || undefined}
          className="aspect-video w-full bg-black"
          aria-label={`${title} project video`}
        >
          <source src={video.src} />
          Your browser does not support embedded video playback.
        </video>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-violet-950/20">
        <iframe
          src={video.embedUrl}
          title={`${title} video showcase`}
          className="aspect-video w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <a
        href={video.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
      >
        Open on {video.kind === "youtube" ? "YouTube" : "Vimeo"}
        <ExternalLink size={12} aria-hidden="true" />
      </a>
    </div>
  );
}
