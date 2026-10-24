"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import {
  apiGetCmsItem,
  getPublicCmsRoute,
  type CmsContentRecord,
  type CmsSection,
} from "@/lib/api";
import { ProjectVideo } from "@/components/portfolio/ProjectVideo";

export function PublicCmsDetail({ section }: { section: CmsSection }) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [result, setResult] = useState<{
    slug: string;
    item: CmsContentRecord | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    apiGetCmsItem(section, slug)
      .then((content) => {
        if (active) setResult({ slug, item: content, error: null });
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setResult({
          slug,
          item: null,
          error: requestError instanceof Error ? requestError.message : "Unable to load this content.",
        });
      });
    return () => {
      active = false;
    };
  }, [section, slug]);

  const loading = result?.slug !== slug;
  const item = loading ? null : result?.item ?? null;
  const error = loading ? null : result?.error ?? null;

  if (loading) return <main className="flex min-h-[55vh] items-center justify-center px-6" role="status"><p className="text-sm text-zinc-400">Loading...</p></main>;
  if (error || !item) {
    const notFound = error?.includes("404") || /not found/i.test(error ?? "");
    return (
      <main className="flex min-h-[55vh] items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <AlertCircle size={25} className="mx-auto text-violet-300" />
          <h1 className="mt-4 text-2xl font-semibold">{notFound ? "Content not found" : "Unable to load content"}</h1>
          <p role={notFound ? undefined : "alert"} className="mt-3 text-sm leading-6 text-zinc-400">{notFound ? "This content is unpublished or the link is incorrect." : "Please try again later."}</p>
          <Link href={getPublicCmsRoute(section)} className="mt-6 inline-flex items-center gap-2 text-sm text-violet-300 hover:text-white"><ArrowLeft size={15} /> Back</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[55vh] max-w-5xl px-6 py-12 md:px-12 md:py-16">
      <Link href={getPublicCmsRoute(section)} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white"><ArrowLeft size={14} /> {section === "tutorials" ? "Tutorials" : "Blog"}</Link>
      <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.26em] text-violet-300">{item.category}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">{item.title}</h1>
      {section === "blogs" && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-400">
          {item.author && <span>By {item.author}</span>}
          {item.publicationDate && <time dateTime={item.publicationDate}>{item.publicationDate}</time>}
        </div>
      )}
      {(item.description || item.excerpt) && <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-300">{item.description || item.excerpt}</p>}
      {(item.thumbnailUrl || item.coverImageUrl) && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.thumbnailUrl ?? item.coverImageUrl ?? ""} alt="" className="max-h-[70vh] w-full object-contain" />
        </div>
      )}
      {section === "tutorials" && item.videoSource && <div className="mt-10"><ProjectVideo videoUrl={item.videoSource} title={item.title} posterUrl={item.thumbnailUrl} /></div>}
      {section === "blogs" && item.body && <article className="prose prose-invert mt-10 max-w-none text-zinc-300 [&_a]:text-violet-300 [&_h2]:my-6 [&_h2]:text-2xl [&_li]:my-1 [&_ol]:list-decimal [&_p]:my-4 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: item.body }} />}
      {item.tags.length > 0 && <ul className="mt-10 flex flex-wrap gap-2">{item.tags.map((tag) => <li key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">{tag}</li>)}</ul>}
    </main>
  );
}
