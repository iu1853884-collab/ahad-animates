"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, FileImage, FileVideo, Trash2, Upload } from "lucide-react";
import {
  apiDeleteCmsMedia,
  apiGetAdminMediaAssets,
  apiGetMe,
  apiUploadCmsMedia,
  type CmsMediaAsset,
} from "@/lib/api";
import { MediaAssetPreview } from "@/components/admin/MediaAssetPreview";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

export function AdminMediaLibrary() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<CmsMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    apiGetMe()
      .then((user) => {
        if (!active) return;
        if (user.role !== "ROLE_ADMIN") {
          router.replace("/admin/login");
          return;
        }
        return apiGetAdminMediaAssets()
          .then((result) => {
            if (active) setAssets(result);
          })
          .catch((requestError: unknown) => {
            if (active) {
              setError(requestError instanceof Error ? requestError.message : "Unable to load media assets.");
            }
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      })
      .catch(() => {
        if (active) router.replace("/admin/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) =>
      !query ||
      asset.originalFilename.toLowerCase().includes(query) ||
      asset.contentType.toLowerCase().includes(query)
    );
  }, [assets, search]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const isImage = IMAGE_TYPES.has(file.type);
    const isVideo = VIDEO_TYPES.has(file.type);
    if (!isImage && !isVideo) {
      setError("Choose a JPG, PNG, WebP, MP4, or WebM file.");
      setNotice(null);
      return;
    }
    if (file.size > (isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES)) {
      setError(isImage ? "Images must be 15 MB or smaller." : "Videos must be 250 MB or smaller.");
      setNotice(null);
      return;
    }

    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const asset = await apiUploadCmsMedia(file);
      setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)].slice(0, 100));
      const reduction = asset.originalSizeBytes && asset.originalSizeBytes > asset.sizeBytes
        ? ` (${((1 - asset.sizeBytes / asset.originalSizeBytes) * 100).toFixed(1)}% smaller)`
        : "";
      setNotice(
        asset.mediaType === "IMAGE"
          ? `${asset.originalFilename} optimized and saved to the media library${reduction}.`
          : `${asset.originalFilename} uploaded and saved to the media library.`
      );
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The media upload request failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Media URL copied.");
      setError(null);
    } catch {
      setError("Clipboard access was denied. Select and copy the URL from the field.");
      setNotice(null);
    }
  };

  const deleteAsset = async (asset: CmsMediaAsset) => {
    if (!window.confirm(`Delete ${asset.originalFilename}? Assets used by a project or CMS entry cannot be deleted.`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await apiDeleteCmsMedia(asset.id);
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setNotice(`${asset.originalFilename} was deleted.`);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this media asset."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#070709] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#09090b]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" aria-label="Back to admin dashboard" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-300">AHAD ANIMATES / ADMIN</p>
              <h1 className="mt-1 text-lg font-semibold">Media Library</h1>
            </div>
          </div>
          <label className={`aa-button aa-button-primary cursor-pointer rounded-xl px-4 py-2.5 text-sm ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload media"}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              className="sr-only"
              aria-label="Upload an image or video to the media library"
              disabled={uploading}
              onChange={(event) => void upload(event)}
            />
          </label>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-6 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Persistent creative assets</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Uploads are stored in the persistent local media directory managed by the backend. Images up to 15 MB are optimized to a maximum 1920-pixel edge; transparent PNGs retain transparency. Videos up to 250 MB are stored unchanged.
            Referenced content cannot be deleted, preventing published pages or drafts from losing their media.
          </p>
        </div>
        <label className="mb-5 block max-w-md">
          <span className="sr-only">Search media</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search filename or media type"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400"
          />
        </label>
        {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-200">{notice}</p>}
        <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025]">
          {loading ? (
            <p role="status" className="px-6 py-16 text-center text-sm text-zinc-400">Loading media library...</p>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-red-200">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-violet-200 hover:border-violet-400/40"
              >
                Retry
              </button>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileImage size={24} className="mx-auto text-zinc-500" aria-hidden="true" />
              <p className="mt-3 text-sm text-zinc-300">{search ? "No matching assets found." : "No uploaded media yet."}</p>
              {!search && <p className="mt-1 text-xs text-zinc-500">Upload an image or video to add it to the library.</p>}
            </div>
          ) : (
            <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset) => (
                <li key={asset.id} className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950/60">
                  <div className="flex aspect-video items-center justify-center bg-black">
                    <MediaAssetPreview asset={asset} />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center gap-2">
                      {asset.mediaType === "VIDEO" ? <FileVideo size={15} className="shrink-0 text-violet-300" /> : <FileImage size={15} className="shrink-0 text-violet-300" />}
                      <p className="truncate text-sm font-medium text-white" title={asset.originalFilename}>{asset.originalFilename}</p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {asset.contentType}
                      {asset.mediaType === "IMAGE" && asset.width && asset.height
                        ? ` · ${asset.width} × ${asset.height}px`
                        : ""}
                      {" · "}
                      {(asset.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                      {asset.mediaType === "IMAGE" ? " · optimized" : ""}
                    </p>
                    <div className="flex gap-2">
                      <input
                        aria-label={`URL for ${asset.originalFilename}`}
                        readOnly
                        value={asset.url}
                        onFocus={(event) => event.currentTarget.select()}
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-2.5 py-2 text-xs text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => void copyUrl(asset.url)}
                        aria-label={`Copy URL for ${asset.originalFilename}`}
                        className="rounded-lg border border-white/10 px-3 text-zinc-300 hover:border-violet-400/40 hover:text-white"
                      >
                        <Copy size={14} aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteAsset(asset)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-200 hover:border-red-400/50 hover:bg-red-500/[0.06]"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Delete unused asset
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!loading && assets.length === 100 && (
          <p className="mt-3 text-xs text-zinc-500">Showing the 100 most recent assets.</p>
        )}
      </section>
    </main>
  );
}
