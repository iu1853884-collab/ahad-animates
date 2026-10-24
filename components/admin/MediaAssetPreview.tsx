"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, apiGetAdminMediaFile, type CmsMediaAsset } from "@/lib/api";

export function isManagedMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === new URL(API_BASE_URL).origin
      && /^\/api\/public\/media\/[1-9]\d*$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function MediaAssetPreview({
  asset,
  className = "h-full w-full object-contain",
}: {
  asset: Pick<CmsMediaAsset, "url" | "mediaType" | "contentType" | "originalFilename">;
  className?: string;
}) {
  const [preview, setPreview] = useState<{ sourceUrl: string; url: string | null; failed: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const resolve = async () => {
      try {
        const url = new URL(asset.url);
        const apiOrigin = new URL(API_BASE_URL).origin;
        const publicMatch = url.origin === apiOrigin
          ? url.pathname.match(/^\/api\/public\/media\/([1-9]\d*)$/)
          : null;
        const adminMatch = url.origin === apiOrigin
          ? url.pathname.match(/^\/api\/admin\/media\/([1-9]\d*)\/file$/)
          : null;
        const match = publicMatch ?? adminMatch;
        if (match) {
          const blob = await apiGetAdminMediaFile(Number(match[1]));
          objectUrl = URL.createObjectURL(blob);
          if (active) setPreview({ sourceUrl: asset.url, url: objectUrl, failed: false });
        } else if (active) {
          setPreview({ sourceUrl: asset.url, url: asset.url, failed: false });
        }
      } catch {
        if (active) setPreview({ sourceUrl: asset.url, url: null, failed: true });
      }
    };

    void resolve();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset.url]);

  const currentPreview = preview?.sourceUrl === asset.url ? preview : null;
  if (currentPreview?.failed) {
    return <p role="status" className="px-4 text-center text-xs text-zinc-500">Preview unavailable.</p>;
  }
  if (!currentPreview?.url) {
    return <p role="status" className="px-4 text-center text-xs text-zinc-500">Loading preview...</p>;
  }
  if (asset.mediaType === "VIDEO") {
    return (
      <video controls preload="metadata" className={className} aria-label={asset.originalFilename}>
        <source src={currentPreview.url} type={asset.contentType} />
      </video>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={currentPreview.url} alt={asset.originalFilename} loading="lazy" className={className} />;
}
