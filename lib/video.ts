/**
 * Safely parse public project video URLs into renderable embeds.
 * Only YouTube, Vimeo, direct HTTPS media files, and this API's managed media
 * endpoint are allowed.
 */

import { API_BASE_URL } from "@/lib/api";

export type SafeVideo =
  | { kind: "youtube"; embedUrl: string; watchUrl: string }
  | { kind: "vimeo"; embedUrl: string; watchUrl: string }
  | { kind: "file"; src: string };

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".ogv", ".mov"];
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function parseAbsoluteHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function extractYouTubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length === 1 && YOUTUBE_ID_PATTERN.test(parts[0])
      ? parts[0]
      : null;
  }

  const embedOrShort = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)\/?$/);
  if (embedOrShort) {
    return YOUTUBE_ID_PATTERN.test(embedOrShort[1]) ? embedOrShort[1] : null;
  }

  if (url.pathname !== "/watch") return null;
  const watchIds = url.searchParams.getAll("v");
  if (watchIds.length === 1 && YOUTUBE_ID_PATTERN.test(watchIds[0])) {
    return watchIds[0];
  }

  return null;
}

function extractVimeoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (!VIMEO_HOSTS.has(host)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "player.vimeo.com") {
    return parts.length === 2 && parts[0] === "video" && /^\d+$/.test(parts[1])
      ? parts[1]
      : null;
  }

  return parts.length === 1 && /^\d+$/.test(parts[0]) ? parts[0] : null;
}

function isDirectVideoFile(url: URL): boolean {
  const path = url.pathname.toLowerCase();
  return DIRECT_VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

function parseManagedMediaUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    const apiOrigin = new URL(API_BASE_URL).origin;
    if (
      url.origin === apiOrigin &&
      /^\/api\/public\/media\/[1-9]\d*$/.test(url.pathname) &&
      !url.search &&
      !url.hash
    ) {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

/** Returns a safe render plan, or null when the URL is missing/unsupported. */
export function parseSafeVideoUrl(value: string | null | undefined): SafeVideo | null {
  if (!value || !value.trim()) return null;

  const managedMediaUrl = parseManagedMediaUrl(value);
  if (managedMediaUrl) {
    return { kind: "file", src: managedMediaUrl.toString() };
  }

  const url = parseAbsoluteHttpsUrl(value);
  if (!url) return null;

  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    };
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return {
      kind: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      watchUrl: `https://vimeo.com/${vimeoId}`,
    };
  }

  if (isDirectVideoFile(url)) {
    return { kind: "file", src: url.toString() };
  }

  return null;
}

export function hasSafeVideoUrl(value: string | null | undefined): boolean {
  return parseSafeVideoUrl(value) !== null;
}
