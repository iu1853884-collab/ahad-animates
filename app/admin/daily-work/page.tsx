"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  apiCreateDailyWork,
  apiDeleteDailyWork,
  apiGetAdminDailyWork,
  apiGetAdminDailyWorkEntry,
  apiGetMe,
  apiUpdateDailyWork,
  apiUpdateDailyWorkStatus,
  type DailyWorkInput,
  type DailyWorkPage,
  type DailyWorkRecord,
  type ProjectStatus,
} from "@/lib/api";

type DailyWorkDraft = Omit<DailyWorkInput, "videoUrl"> & { videoUrl: string };

const emptyDraft: DailyWorkDraft = {
  title: "",
  description: "",
  workDate: new Date().toISOString().slice(0, 10),
  category: "",
  thumbnailUrl: "",
  videoUrl: "",
  status: "DRAFT",
};

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

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function isThumbnailUrl(value: string) {
  return (
    (value.trim().toLowerCase().startsWith("https://") &&
      isHttpUrl(value)) ||
    (value.startsWith("/images/") &&
      !value.includes("..") &&
      /^\/images\/[A-Za-z0-9._/-]+$/.test(value))
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400";

export default function AdminDailyWorkPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState<DailyWorkPage>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DailyWorkRecord | null>(null);
  const [draft, setDraft] = useState<DailyWorkDraft>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiGetMe()
      .then((user) => {
        if (!mounted) return;
        if (user.role !== "ROLE_ADMIN") {
          router.replace("/admin/login");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => {
        if (mounted) router.replace("/admin/login");
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    let mounted = true;
    apiGetAdminDailyWork({
      category,
      status,
      fromDate,
      toDate,
      page: pageNumber,
      size: 12,
    })
      .then((result) => {
        if (mounted) {
          setData(result);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (mounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load daily work."
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [authorized, category, status, fromDate, toDate, pageNumber]);

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await apiGetAdminDailyWork({
        category,
        status,
        fromDate,
        toDate,
        page: pageNumber,
        size: 12,
      });
      setData(result);
      setError(null);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load daily work."
      );
    } finally {
      setLoading(false);
    }
  };

  const startFilter = (change: () => void) => {
    setLoading(true);
    setPageNumber(0);
    change();
  };

  const startCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setFormError(null);
    setFormOpen(true);
  };

  const startEdit = async (entry: DailyWorkRecord) => {
    setFormError(null);
    try {
      const latest = await apiGetAdminDailyWorkEntry(entry.id);
      setEditing(latest);
      setDraft({
        title: latest.title,
        description: latest.description,
        workDate: latest.workDate,
        category: latest.category,
        thumbnailUrl: latest.thumbnailUrl,
        videoUrl: latest.videoUrl ?? "",
        status: latest.status,
      });
      setFormOpen(true);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to open this entry."
      );
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const saveEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!isThumbnailUrl(draft.thumbnailUrl)) {
      setFormError("Enter an HTTPS thumbnail URL or a local /images/ path.");
      return;
    }
    if (draft.videoUrl && !isHttpUrl(draft.videoUrl)) {
      setFormError("Video URL must be a valid HTTP or HTTPS URL.");
      return;
    }

    const payload: DailyWorkInput = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category.trim(),
      thumbnailUrl: draft.thumbnailUrl.trim(),
      videoUrl: draft.videoUrl.trim() || null,
    };
    setSaving(true);
    try {
      if (editing) {
        await apiUpdateDailyWork(editing.id, payload);
      } else {
        await apiCreateDailyWork(payload);
      }
      closeForm();
      await refresh();
    } catch (requestError: unknown) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the entry."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (entry: DailyWorkRecord) => {
    try {
      await apiUpdateDailyWorkStatus(
        entry.id,
        entry.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
      );
      await refresh();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to change publication status."
      );
    }
  };

  const deleteEntry = async (entry: DailyWorkRecord) => {
    if (!window.confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    try {
      await apiDeleteDailyWork(entry.id);
      await refresh();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the entry."
      );
    }
  };

  if (authLoading || !authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070709] text-white">
        <p className="text-sm text-zinc-400" role="status">
          Verifying administrator access...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070709] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#09090b]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              aria-label="Back to admin console"
              className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-violet-400/50 hover:text-white"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-300">
                AHAD ANIMATES / ADMIN
              </p>
              <h1 className="mt-1 text-lg font-semibold">Daily work</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <Plus size={16} />
            New entry
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Studio journal
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Record the Process
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Manage dated work entries. Only published entries appear in the public journal.
            </p>
          </div>
          <Link
            href="/daily-work"
            target="_blank"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-violet-400/40 hover:text-white lg:self-auto"
          >
            View public archive
            <ExternalLink size={13} />
          </Link>
        </div>

        <div className="mb-5 grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-zinc-400">
            Category
            <select
              value={category}
              onChange={(event) =>
                startFilter(() => setCategory(event.target.value))
              }
              className={filterClass}
            >
              <option value="">All categories</option>
              {data.categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-400">
            Status
            <select
              value={status}
              onChange={(event) =>
                startFilter(() =>
                  setStatus(event.target.value as ProjectStatus | "")
                )
              }
              className={filterClass}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-400">
            From date
            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                startFilter(() => {
                  const value = event.target.value;
                  if (toDate && value > toDate) setToDate("");
                  setFromDate(value);
                })
              }
              max={toDate || undefined}
              className={filterClass}
            />
          </label>
          <label className="text-xs font-medium text-zinc-400">
            To date
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) =>
                startFilter(() => setToDate(event.target.value))
              }
              className={filterClass}
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
            <h3 className="text-sm font-semibold">All work entries</h3>
            <span className="text-xs text-zinc-500">{data.totalItems} total</span>
          </div>
          {loading ? (
            <p className="px-6 py-16 text-center text-sm text-zinc-400" role="status">
              Loading work entries...
            </p>
          ) : data.items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-zinc-300">No work entries match these filters.</p>
              <button
                type="button"
                onClick={startCreate}
                className="mt-4 text-sm font-medium text-violet-300 hover:text-violet-200"
              >
                Record a work entry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {data.items.map((entry) => (
                <article
                  key={entry.id}
                  className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.thumbnailUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl border border-white/10 bg-zinc-950 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-semibold">{entry.title}</h4>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          entry.status === "PUBLISHED"
                            ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300"
                            : "border-amber-400/25 bg-amber-400/[0.08] text-amber-200"
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {entry.category} <span className="px-1.5 text-zinc-600">·</span> {entry.workDate}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                        {entry.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => void toggleStatus(entry)}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:text-white"
                    >
                      {entry.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void startEdit(entry)}
                      aria-label={`Edit ${entry.title}`}
                      className="rounded-lg border border-white/10 p-2.5 text-zinc-400 transition hover:border-violet-400/40 hover:text-white"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteEntry(entry)}
                      aria-label={`Delete ${entry.title}`}
                      className="rounded-lg border border-white/10 p-2.5 text-zinc-400 transition hover:border-red-400/40 hover:text-red-300"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {data.totalPages > 1 && (
            <nav aria-label="Admin daily work pages" className="flex items-center justify-between border-t border-white/[0.08] px-5 py-4">
              <button
                type="button"
                disabled={data.first || loading}
                onClick={() => {
                  setLoading(true);
                  setPageNumber((current) => current - 1);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-40"
              >
                <ArrowLeft size={14} />
                Newer
              </button>
              <span className="text-xs text-zinc-500">
                Page {data.page + 1} of {data.totalPages}
              </span>
              <button
                type="button"
                disabled={data.last || loading}
                onClick={() => {
                  setLoading(true);
                  setPageNumber((current) => current + 1);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-40"
              >
                Older
                <ArrowRight size={14} />
              </button>
            </nav>
          )}
        </div>
      </section>

      {formOpen && (
        <DailyWorkForm
          draft={draft}
          setDraft={setDraft}
          editing={Boolean(editing)}
          saving={saving}
          error={formError}
          onClose={closeForm}
          onSubmit={saveEntry}
        />
      )}
    </main>
  );
}

function DailyWorkForm({
  draft,
  setDraft,
  editing,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  draft: DailyWorkDraft;
  setDraft: (draft: DailyWorkDraft) => void;
  editing: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const field = <K extends keyof DailyWorkDraft>(
    key: K,
    value: DailyWorkDraft[K]
  ) => setDraft({ ...draft, [key]: value });

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-work-form-title"
        className="my-auto max-h-[96vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#101014] p-5 shadow-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">
              Studio journal
            </p>
            <h2 id="daily-work-form-title" className="mt-1 text-xl font-semibold">
              {editing ? "Edit work entry" : "Record daily work"}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="daily-title">
              <input
                id="daily-title"
                required
                minLength={2}
                maxLength={160}
                value={draft.title}
                onChange={(event) => field("title", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Work date" htmlFor="daily-date">
              <input
                id="daily-date"
                type="date"
                required
                value={draft.workDate}
                onChange={(event) => field("workDate", event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Category" htmlFor="daily-category">
            <input
              id="daily-category"
              required
              maxLength={100}
              value={draft.category}
              onChange={(event) => field("category", event.target.value)}
              className={inputClass}
              placeholder="e.g. Product Visualization"
            />
          </Field>
          <Field label="Description" htmlFor="daily-description">
            <textarea
              id="daily-description"
              required
              maxLength={5000}
              rows={4}
              value={draft.description}
              onChange={(event) => field("description", event.target.value)}
              className={`${inputClass} resize-y`}
            />
          </Field>
          <Field label="Thumbnail / media reference" htmlFor="daily-thumbnail">
            <input
              id="daily-thumbnail"
              required
              maxLength={2048}
              value={draft.thumbnailUrl}
              onChange={(event) => field("thumbnailUrl", event.target.value)}
              className={inputClass}
              placeholder="https://… or /images/your-image.svg"
            />
            <p className="mt-1.5 text-[11px] text-zinc-500">
              Use an existing HTTPS image URL or local /images/ path. Uploads are not enabled.
            </p>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Video URL (optional)" htmlFor="daily-video">
              <input
                id="daily-video"
                maxLength={2048}
                value={draft.videoUrl}
                onChange={(event) => field("videoUrl", event.target.value)}
                className={inputClass}
                placeholder="https://…"
              />
            </Field>
            <Field label="Publication" htmlFor="daily-status">
              <select
                id="daily-status"
                value={draft.status}
                onChange={(event) => field("status", event.target.value as ProjectStatus)}
                className={inputClass}
              >
                <option value="DRAFT">Draft — private</option>
                <option value="PUBLISHED">Published — public</option>
              </select>
            </Field>
          </div>
          {error && (
            <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-white/25 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : editing ? "Save changes" : "Save entry"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-zinc-300">
        {label}
      </label>
      {children}
    </div>
  );
}

const filterClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400";
