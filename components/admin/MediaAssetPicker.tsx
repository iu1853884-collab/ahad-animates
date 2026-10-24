"use client";

import { useEffect, useState } from "react";
import { Check, Image as ImageIcon, X } from "lucide-react";
import { apiGetAdminMediaAssets, type CmsMediaAsset } from "@/lib/api";
import { MediaAssetPreview } from "@/components/admin/MediaAssetPreview";

export function MediaAssetPicker({
  onSelect,
  label = "Choose from library",
  mediaType = "IMAGE",
}: {
  onSelect: (asset: CmsMediaAsset) => void;
  label?: string;
  mediaType?: "IMAGE" | "VIDEO" | "ALL";
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<CmsMediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    apiGetAdminMediaAssets()
      .then((result) => {
        if (active) {
          setAssets(mediaType === "ALL" ? result : result.filter((asset) => asset.mediaType === mediaType));
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load the media library.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mediaType, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setLoading(true);
          setOpen(true);
        }}
        className="aa-button aa-button-secondary shrink-0 rounded-xl px-3 py-2.5 text-xs"
      >
        <ImageIcon size={14} aria-hidden="true" />
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-picker-title"
            className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0e] shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 id="media-picker-title" className="font-semibold text-white">
                  Choose {mediaType === "IMAGE" ? "an image" : mediaType === "VIDEO" ? "a video" : "media"}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">Selecting an asset replaces the current media URL.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close media picker"
                className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </header>
            <div className="overflow-y-auto p-5">
              {error && <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-3 text-sm text-red-200">{error}</p>}
              {loading ? (
                <p role="status" className="py-12 text-center text-sm text-zinc-400">Loading images...</p>
              ) : !error && assets.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-zinc-300">No matching uploaded media is available.</p>
                  <a href="/admin/media" className="mt-2 inline-block text-sm text-violet-300 hover:text-violet-200">Open the media library to upload one.</a>
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {assets.map((asset) => (
                    <li key={asset.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                      <div className="flex aspect-video items-center justify-center">
                        <MediaAssetPreview asset={asset} />
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3">
                        <p className="truncate text-xs text-zinc-300" title={asset.originalFilename}>{asset.originalFilename}</p>
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(asset);
                            setOpen(false);
                          }}
                          className="aa-button aa-button-primary shrink-0 rounded-lg px-2.5 py-2 text-xs"
                        >
                          <Check size={13} aria-hidden="true" />
                          Select
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
