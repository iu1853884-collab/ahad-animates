"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  apiGetCmsContent,
  getPublicCmsRoute,
  type CmsContentRecord,
  type CmsSection,
} from "@/lib/api";

export function PublicCmsListing({ section }: { section: CmsSection }) {
  const [items, setItems] = useState<CmsContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGetCmsContent(section)
      .then((content) => {
        if (active) setItems(content);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load published content.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [section]);

  if (loading) return <p className="mt-10 text-sm text-zinc-400" role="status">Loading published content...</p>;
  if (error) return <p className="mt-10 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-200" role="alert">Published content could not be reached. Please try again later.</p>;
  if (!items.length) return <p className="mt-10 rounded-xl border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-zinc-400">No published content is available yet.</p>;

  return (
    <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition hover:border-violet-400/40">
          {section === "ads-videos" ? (
            <div className="aspect-video bg-zinc-950">
              {item.mediaType === "VIDEO" ? (
                <video controls preload="metadata" playsInline poster={item.thumbnailUrl ?? undefined} className="h-full w-full object-contain" aria-label={`${item.title} advertising video`}>
                  <source src={item.mediaUrl ?? ""} />
                </video>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.mediaUrl ?? ""} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
          ) : (
            <Link href={getPublicCmsRoute(section, item.slug)} className="block">
              {item.thumbnailUrl || item.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnailUrl ?? item.coverImageUrl ?? ""} alt="" loading="lazy" className="aspect-video w-full bg-zinc-950 object-cover" />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-violet-950/60 to-zinc-950" aria-hidden="true" />
              )}
            </Link>
          )}
          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">{item.category}</p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {section === "ads-videos" ? item.title : <Link href={getPublicCmsRoute(section, item.slug)} className="hover:text-violet-200">{item.title}</Link>}
            </h2>
            {item.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{item.excerpt}</p>}
            {item.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{item.description}</p>}
            {item.publicationDate && <time className="mt-3 block text-xs text-zinc-500" dateTime={item.publicationDate}>{item.publicationDate}</time>}
          </div>
        </li>
      ))}
    </ul>
  );
}
