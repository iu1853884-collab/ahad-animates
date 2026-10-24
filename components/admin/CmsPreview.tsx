"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { apiGetAdminCmsItem, apiGetMe, type CmsContentRecord, type CmsSection } from "@/lib/api";
import { ProjectVideo } from "@/components/portfolio/ProjectVideo";
import { isManagedMediaUrl, MediaAssetPreview } from "@/components/admin/MediaAssetPreview";

const labels: Record<CmsSection, string> = {
  tutorials: "Tutorials",
  "ads-videos": "Ads & Videos",
  blogs: "Blogs",
};

export function CmsPreview({ section }: { section: CmsSection }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<CmsContentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGetMe()
      .then((user) => {
        if (!active) return;
        if (user.role !== "ROLE_ADMIN") {
          router.replace("/admin/login");
          return;
        }
        const id = Number(params.id);
        if (!Number.isSafeInteger(id) || id < 1) {
          setError("Invalid content ID.");
          setLoading(false);
          return;
        }
        return apiGetAdminCmsItem(section, id).then((content) => {
          if (active) setItem(content);
        });
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load preview.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id, router, section]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#08080b] text-sm text-zinc-400" role="status">Loading preview...</main>;
  if (error || !item) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080b] px-6 text-center text-white">
        <div><AlertCircle className="mx-auto text-amber-300" /><h1 className="mt-4 text-xl font-semibold">Preview unavailable</h1><p role="alert" className="mt-2 text-sm text-zinc-400">{error ?? "Content was not found."}</p><Link href={`/admin/${section}`} className="mt-5 inline-flex items-center gap-2 text-sm text-violet-300"><ArrowLeft size={15} /> Back to manager</Link></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08080b] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href={`/admin/${section}/${item.id}/edit`} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"><ArrowLeft size={15} /> Edit {labels[section].slice(0, -1)}</Link>
          <span className={`rounded-full border px-3 py-1 text-xs ${item.status === "PUBLISHED" ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-200"}`}>{item.status} preview</span>
        </div>
      </header>
      <article className="mx-auto max-w-5xl px-6 py-12 md:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">{item.category}</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{item.title}</h1>
        {(item.description || item.excerpt) && <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300">{item.description || item.excerpt}</p>}
        {(item.thumbnailUrl || item.coverImageUrl) && (
          <div className="mt-8 max-h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-black">
            <MediaAssetPreview
              asset={{
                url: item.thumbnailUrl ?? item.coverImageUrl ?? "",
                mediaType: "IMAGE",
                contentType: "image/jpeg",
                originalFilename: item.title,
              }}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        )}
        {section === "tutorials" && item.videoSource && (
          <div className="mt-8">
            {isManagedMediaUrl(item.videoSource) ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                <MediaAssetPreview
                  asset={{
                    url: item.videoSource,
                    mediaType: "VIDEO",
                    contentType: "video/mp4",
                    originalFilename: item.title,
                  }}
                  className="aspect-video w-full"
                />
              </div>
            ) : (
              <ProjectVideo videoUrl={item.videoSource} title={item.title} posterUrl={item.thumbnailUrl} />
            )}
          </div>
        )}
        {section === "ads-videos" && item.mediaUrl && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black">
            <MediaAssetPreview
              asset={{
                url: item.mediaUrl,
                mediaType: item.mediaType ?? "IMAGE",
                contentType: item.mediaType === "VIDEO" ? "video/mp4" : "image/jpeg",
                originalFilename: item.title,
              }}
              className={item.mediaType === "VIDEO" ? "aspect-video w-full" : "max-h-[70vh] w-full object-contain"}
            />
          </div>
        )}
        {section === "blogs" && item.body && <div className="mt-8 max-w-none text-zinc-300 [&_a]:text-violet-300 [&_h2]:my-6 [&_h2]:text-2xl [&_li]:my-1 [&_ol]:list-decimal [&_p]:my-4 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: item.body }} />}
      </article>
    </main>
  );
}
