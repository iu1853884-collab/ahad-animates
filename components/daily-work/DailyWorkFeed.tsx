"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import {
  apiGetPublicDailyWork,
  type DailyWorkPage,
} from "@/lib/api";
import { hasSafeVideoUrl } from "@/lib/video";
import { ProjectVideo } from "@/components/portfolio/ProjectVideo";

interface DailyWorkFeedProps {
  archive?: boolean;
  limit?: number;
}

const emptyPage: DailyWorkPage = {
  items: [],
  page: 0,
  size: 12,
  totalItems: 0,
  totalPages: 0,
  first: true,
  last: true,
  categories: [],
};

export function DailyWorkFeed({
  archive = false,
  limit = 3,
}: DailyWorkFeedProps) {
  const [page, setPage] = useState<DailyWorkPage>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageNumber, setPageNumber] = useState(0);

  useEffect(() => {
    let isMounted = true;
    apiGetPublicDailyWork({
      category: archive ? category : undefined,
      fromDate: archive ? fromDate : undefined,
      toDate: archive ? toDate : undefined,
      page: archive ? pageNumber : 0,
      size: archive ? 12 : limit,
    })
      .then((data) => {
        if (isMounted) {
          setPage(data);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load daily work."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [archive, category, fromDate, toDate, pageNumber, limit]);

  const categories = useMemo(() => page.categories, [page.categories]);

  const updateCategory = (value: string) => {
    setLoading(true);
    setPageNumber(0);
    setCategory(value);
  };

  const updateFromDate = (value: string) => {
    setLoading(true);
    setPageNumber(0);
    setFromDate(value);
  };

  const updateToDate = (value: string) => {
    setLoading(true);
    setPageNumber(0);
    setToDate(value);
  };

  return (
    <section
      id={archive ? undefined : "daily-work"}
      className={`relative mx-auto max-w-7xl px-6 md:px-12 ${
        archive ? "py-10" : "py-24"
      }`}
    >
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-violet-400">
            STUDIO JOURNAL
          </p>
          {archive ? (
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Daily Work
            </h1>
          ) : (
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Daily Work
            </h2>
          )}
          <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
            A dated archive of published creative work from the studio.
          </p>
        </div>
        {!archive && (
          <Link
            href="/daily-work"
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-200 transition hover:border-violet-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:self-auto"
          >
            Browse archive
            <ArrowRight size={14} className="text-violet-400" />
          </Link>
        )}
      </div>

      {archive && (
        <div className="mt-8 grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:grid-cols-3">
          <label className="text-xs font-medium text-zinc-400">
            Category
            <select
              value={category}
              onChange={(event) => updateCategory(event.target.value)}
              className={filterClass}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-400">
            From date
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => {
                const value = event.target.value;
                if (toDate && value > toDate) updateToDate("");
                updateFromDate(value);
              }}
              className={filterClass}
            />
          </label>
          <label className="text-xs font-medium text-zinc-400">
            To date
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => updateToDate(event.target.value)}
              className={filterClass}
            />
          </label>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-8 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <div>
            <p>Daily work could not be loaded.</p>
            <p className="mt-1 text-xs text-red-200/70">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="mt-10 py-12 text-center text-sm text-zinc-400" role="status">
          Loading studio journal...
        </p>
      ) : !error && page.items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-14 text-center">
          <CalendarDays size={24} className="mx-auto text-zinc-500" />
          <p className="mt-4 text-sm font-medium text-zinc-300">
            {archive ? "No published entries match these filters." : "No daily work entries have been published yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.items.map((entry) => (
              <article
                key={entry.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition hover:border-violet-400/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.thumbnailUrl}
                    alt={`${entry.title} thumbnail`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-zinc-500">
                    <time dateTime={entry.workDate}>
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(new Date(`${entry.workDate}T00:00:00Z`))}
                    </time>
                    <span className="rounded-full border border-violet-400/20 bg-violet-400/[0.06] px-2.5 py-1 text-violet-200">
                      {entry.category}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-white">
                    {entry.title}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">
                    {entry.description}
                  </p>
                  {hasSafeVideoUrl(entry.videoUrl) && (
                    <div className="mt-5">
                      <ProjectVideo
                        videoUrl={entry.videoUrl}
                        title={entry.title}
                        posterUrl={entry.thumbnailUrl}
                      />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {archive && page.totalPages > 1 && (
            <nav
              aria-label="Daily work archive pages"
              className="mt-10 flex items-center justify-between border-t border-white/[0.08] pt-5"
            >
              <button
                type="button"
                disabled={page.first}
                onClick={() => {
                  setLoading(true);
                  setPageNumber((current) => current - 1);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-violet-400/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={14} />
                Newer entries
              </button>
              <span className="text-xs text-zinc-500">
                Page {page.page + 1} of {page.totalPages}
              </span>
              <button
                type="button"
                disabled={page.last}
                onClick={() => {
                  setLoading(true);
                  setPageNumber((current) => current + 1);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-violet-400/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Older entries
                <ArrowRight size={14} />
              </button>
            </nav>
          )}

          {archive && (
            <p className="mt-4 text-center text-xs text-zinc-600">
              {page.totalItems} published {page.totalItems === 1 ? "entry" : "entries"}
            </p>
          )}
        </>
      )}
    </section>
  );
}

const filterClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400";
