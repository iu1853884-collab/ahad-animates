"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bold,
  ExternalLink,
  Italic,
  List,
  ListOrdered,
  Plus,
  Save,
  Trash2,
  Underline,
  Upload,
} from "lucide-react";
import {
  apiCreateCmsItem,
  apiDeleteCmsItem,
  apiGetAdminCmsContent,
  apiGetAdminCmsItem,
  apiGetMe,
  apiUpdateCmsItem,
  apiUpdateCmsStatus,
  apiUploadCmsMedia,
  type CmsContentInput,
  type CmsContentRecord,
  type CmsMediaType,
  type CmsSection,
  type ProjectStatus,
} from "@/lib/api";
import { MediaAssetPicker } from "@/components/admin/MediaAssetPicker";
import { MediaAssetPreview } from "@/components/admin/MediaAssetPreview";

type EditorMode = "list" | "new" | "edit";
type Draft = CmsContentInput;

const sectionLabels: Record<CmsSection, string> = {
  tutorials: "Tutorials",
  "ads-videos": "Ads & Videos",
  blogs: "Blogs",
};

const emptyDraft: Draft = {
  title: "",
  slug: "",
  description: "",
  excerpt: "",
  coverImageUrl: "",
  body: "",
  videoSource: "",
  category: "",
  tags: [],
  author: "",
  publicationDate: "",
  thumbnailUrl: "",
  mediaUrl: "",
  mediaType: null,
  displayOrder: 0,
  status: "DRAFT",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function CmsRichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value) {
      editor.current.innerHTML = value;
    }
  }, [value]);

  const command = (name: string, argument?: string) => {
    editor.current?.focus();
    document.execCommand(name, false, argument);
    if (editor.current) onChange(editor.current.innerHTML);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950 focus-within:border-violet-400">
      <div
        className="flex flex-wrap gap-1 border-b border-white/10 bg-zinc-900/70 p-2"
        role="toolbar"
        aria-label="Article formatting"
      >
        {[
          { label: "Bold", icon: <Bold size={15} />, command: "bold" },
          { label: "Italic", icon: <Italic size={15} />, command: "italic" },
          {
            label: "Underline",
            icon: <Underline size={15} />,
            command: "underline",
          },
          {
            label: "Bulleted list",
            icon: <List size={15} />,
            command: "insertUnorderedList",
          },
          {
            label: "Numbered list",
            icon: <ListOrdered size={15} />,
            command: "insertOrderedList",
          },
        ].map((tool) => (
          <button
            key={tool.command}
            type="button"
            aria-label={tool.label}
            title={tool.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command(tool.command)}
            className="rounded-lg border border-transparent p-2 text-zinc-400 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
          >
            {tool.icon}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("formatBlock", "h2")}
          className="rounded-lg border border-transparent px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
        >
          Heading
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const href = window.prompt("Enter an HTTPS link");
            if (href && /^https:\/\/[^/]+/i.test(href)) command("createLink", href);
          }}
          className="rounded-lg border border-transparent px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
        >
          Link
        </button>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Article body"
        aria-multiline="true"
        data-placeholder="Write your article here..."
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="min-h-72 px-4 py-4 text-sm leading-7 text-zinc-200 outline-none [&_a]:text-violet-300 [&_h2]:my-4 [&_h2]:text-xl [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-3 [&_ul]:list-disc"
      />
    </div>
  );
}

export function CmsContentManager({
  section,
  mode,
  itemId,
}: {
  section: CmsSection;
  mode: EditorMode;
  itemId?: number;
}) {
  const router = useRouter();
  const label = sectionLabels[section];
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<CmsContentRecord[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [initializing, setInitializing] = useState(mode === "edit" && itemId !== undefined);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    let active = true;
    apiGetMe()
      .then((user) => {
        if (!active) return;
        if (user.role !== "ROLE_ADMIN") {
          router.replace("/admin/login");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => {
        if (active) router.replace("/admin/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authorized || mode !== "list") return;
    let active = true;
    apiGetAdminCmsContent(section, statusFilter)
      .then((result) => {
        if (!active) return;
        setItems(result);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : `Unable to load ${label.toLowerCase()}.`
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorized, label, mode, section, statusFilter]);

  useEffect(() => {
    if (!authorized || mode === "list" || !itemId) return;
    let active = true;
    if (mode === "new") {
      return () => {
        active = false;
      };
    }
    apiGetAdminCmsItem(section, itemId)
      .then((item) => {
        if (!active) return;
        setDraft({
          title: item.title,
          slug: item.slug,
          description: item.description ?? "",
          excerpt: item.excerpt ?? "",
          coverImageUrl: item.coverImageUrl ?? "",
          body: item.body ?? "",
          videoSource: item.videoSource ?? "",
          category: item.category,
          tags: item.tags,
          author: item.author ?? "",
          publicationDate: item.publicationDate ?? "",
          thumbnailUrl: item.thumbnailUrl ?? "",
          mediaUrl: item.mediaUrl ?? "",
          mediaType: item.mediaType,
          displayOrder: item.displayOrder,
          status: item.status,
        });
        setSlugTouched(true);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load this content."
          );
        }
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [authorized, itemId, mode, section]);

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.slug.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle)
    );
  }, [items, search]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const upload = async (
    file: File,
    target: "videoSource" | "mediaUrl" | "coverImageUrl" | "thumbnailUrl"
  ) => {
    setUploading(true);
    setError(null);
    try {
      const asset = await apiUploadCmsMedia(file);
      if (target === "videoSource") update("videoSource", asset.url);
      if (target === "mediaUrl") {
        update("mediaUrl", asset.url);
        update("mediaType", asset.mediaType);
        if (asset.mediaType === "IMAGE" && !draft.thumbnailUrl) {
          update("thumbnailUrl", asset.url);
        }
      }
      if (target === "coverImageUrl") update("coverImageUrl", asset.url);
      if (target === "thumbnailUrl") update("thumbnailUrl", asset.url);
      setSuccess(`${asset.originalFilename} uploaded (${Math.ceil(asset.sizeBytes / 1024)} KB).`);
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload: Draft = {
      ...draft,
      description: draft.description?.trim() || null,
      excerpt: draft.excerpt?.trim() || null,
      coverImageUrl: draft.coverImageUrl?.trim() || null,
      body: draft.body?.trim() || null,
      videoSource: draft.videoSource?.trim() || null,
      thumbnailUrl: draft.thumbnailUrl?.trim() || null,
      mediaUrl: draft.mediaUrl?.trim() || null,
      author: draft.author?.trim() || null,
      tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
    };
    try {
      if (mode === "edit" && itemId) {
        await apiUpdateCmsItem(section, itemId, payload);
        setSuccess(`${label.slice(0, -1)} updated successfully.`);
      } else {
        await apiCreateCmsItem(section, payload);
        setSuccess(`${label.slice(0, -1)} created successfully.`);
      }
      router.push(`/admin/${section}`);
      router.refresh();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save content.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (item: CmsContentRecord) => {
    setError(null);
    setSuccess(null);
    try {
      const nextStatus = item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      await apiUpdateCmsStatus(section, item.id, nextStatus);
      setSuccess(nextStatus === "PUBLISHED" ? "Content published." : "Content unpublished.");
      setItems((current) =>
        statusFilter && nextStatus !== statusFilter
          ? current.filter((entry) => entry.id !== item.id)
          : current.map((entry) =>
              entry.id === item.id ? { ...entry, status: nextStatus } : entry
            )
      );
    } catch (statusError: unknown) {
      setError(statusError instanceof Error ? statusError.message : "Unable to change status.");
    }
  };

  const deleteItem = async (item: CmsContentRecord) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setError(null);
    setSuccess(null);
    try {
      await apiDeleteCmsItem(section, item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setSuccess("Content deleted.");
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete content.");
    }
  };

  if (!authorized || (mode !== "list" && initializing)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070709] text-sm text-zinc-400" role="status">
        {authorized ? "Loading content..." : "Verifying administrator access..."}
      </main>
    );
  }

  if (mode === "list") {
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
                <h1 className="mt-1 text-lg font-semibold">{label}</h1>
              </div>
            </div>
            <Link href={`/admin/${section}/new`} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500">
              <Plus size={16} /> Add {label.slice(0, -1).toLowerCase()}
            </Link>
          </div>
        </header>
        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Content library</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Manage {label.toLowerCase()}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="sr-only" htmlFor="cms-search">Search content</label>
              <input id="cms-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${label.toLowerCase()}`} className={`${inputClass} min-w-52`} />
              <label className="sr-only" htmlFor="cms-status">Filter by status</label>
              <select id="cms-status" value={statusFilter} onChange={(event) => { setLoading(true); setStatusFilter(event.target.value as ProjectStatus | ""); }} className={`${inputClass} min-w-36`}>
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
          {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">{error}</p>}
          {success && <p role="status" className="mb-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-200">{success}</p>}
          <section className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <h3 className="text-sm font-semibold">All {label.toLowerCase()}</h3>
              <span className="text-xs text-zinc-500">{visibleItems.length} items</span>
            </div>
            {loading ? (
              <p role="status" className="px-6 py-16 text-center text-sm text-zinc-400">Loading {label.toLowerCase()}...</p>
            ) : visibleItems.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-zinc-400">
                No {label.toLowerCase()} found. <Link className="text-violet-300 hover:text-violet-200" href={`/admin/${section}/new`}>Add one</Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.07]">
                {visibleItems.map((item) => (
                  <li key={item.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${item.status === "PUBLISHED" ? "border-emerald-400/25 text-emerald-300" : "border-amber-400/25 text-amber-200"}`}>{item.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{item.category} · /{item.slug}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/${section}/${item.id}/preview`} className="aa-button aa-button-icon rounded-lg" aria-label={`Preview ${item.title}`}>
                        <ExternalLink size={15} />
                      </Link>
                      <button type="button" onClick={() => void updateStatus(item)} className={`aa-button rounded-lg px-3 py-2 text-xs ${item.status === "PUBLISHED" ? "aa-button-outline" : "aa-button-primary"}`}>{item.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                      <Link href={`/admin/${section}/${item.id}/edit`} className="aa-button aa-button-secondary rounded-lg px-3 py-2 text-xs">Edit</Link>
                      <button type="button" onClick={() => void deleteItem(item)} aria-label={`Delete ${item.title}`} className="aa-button aa-button-icon aa-button-destructive rounded-lg"><Trash2 size={15} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </main>
    );
  }

  const imageAccept = "image/jpeg,image/png,image/webp";
  const videoAccept = "video/mp4,video/webm";
  const isEdit = mode === "edit";

  return (
    <main className="min-h-screen bg-[#070709] text-white">
      <header className="border-b border-white/[0.08] bg-[#09090b]/90 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href={`/admin/${section}`} aria-label={`Back to ${label}`} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white"><ArrowLeft size={16} /></Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-300">AHAD ANIMATES / {label.toUpperCase()}</p>
            <h1 className="mt-1 text-lg font-semibold">{isEdit ? "Edit" : "Add"} {label.slice(0, -1).toLowerCase()}</h1>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">{error}</p>}
        {success && <p role="status" className="mb-5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-200">{success}</p>}
        <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Title">
              <input required minLength={2} maxLength={180} value={draft.title} onChange={(event) => {
                const title = event.target.value;
                setDraft((current) => ({ ...current, title, ...(!isEdit && !slugTouched ? { slug: slugify(title) } : {}) }));
              }} className={inputClass} />
            </Field>
            <Field label="Slug">
              <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={200} value={draft.slug} onChange={(event) => { setSlugTouched(true); update("slug", event.target.value); }} className={inputClass} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category">
              <input required maxLength={120} value={draft.category} onChange={(event) => update("category", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Tags (comma separated)">
              <input value={draft.tags.join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} className={inputClass} />
            </Field>
          </div>
          {section === "tutorials" && (
            <>
              <Field label="Description">
                <textarea maxLength={10000} rows={3} value={draft.description ?? ""} onChange={(event) => update("description", event.target.value)} className={`${inputClass} resize-y`} />
              </Field>
              <Field label="Thumbnail URL">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="url" value={draft.thumbnailUrl ?? ""} onChange={(event) => update("thumbnailUrl", event.target.value)} className={inputClass} placeholder="https://…" />
                  <UploadField accept={imageAccept} label="Upload thumbnail" disabled={uploading} onFile={(file) => void upload(file, "thumbnailUrl")} />
                          <MediaAssetPicker onSelect={(asset) => update("thumbnailUrl", asset.url)} />
                        </div>
              </Field>
              <Field label="Video source URL">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="url" value={draft.videoSource ?? ""} onChange={(event) => update("videoSource", event.target.value)} className={inputClass} placeholder="YouTube, Vimeo, or uploaded video URL" />
                  <UploadField accept={videoAccept} label="Upload video" disabled={uploading} onFile={(file) => void upload(file, "videoSource")} />
                  <MediaAssetPicker
                    label="Choose video"
                    mediaType="VIDEO"
                    onSelect={(asset) => update("videoSource", asset.url)}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">YouTube/Vimeo and direct MP4/WebM playback are supported. Upload limit: 250 MB.</p>
              </Field>
            </>
          )}
          {section === "ads-videos" && (
            <>
              <Field label="Description">
                <textarea maxLength={10000} rows={3} value={draft.description ?? ""} onChange={(event) => update("description", event.target.value)} className={`${inputClass} resize-y`} />
              </Field>
              <Field label="Advertising image or video">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="url" required value={draft.mediaUrl ?? ""} onChange={(event) => update("mediaUrl", event.target.value)} className={inputClass} placeholder="Uploaded media URL" />
                  <UploadField accept={`${imageAccept},${videoAccept}`} label="Upload media" disabled={uploading} onFile={(file) => void upload(file, "mediaUrl")} />
                  <MediaAssetPicker
                    label="Choose media"
                    mediaType="ALL"
                    onSelect={(asset) => {
                      update("mediaUrl", asset.url);
                      update("mediaType", asset.mediaType);
                      if (asset.mediaType === "IMAGE" && !draft.thumbnailUrl) {
                        update("thumbnailUrl", asset.url);
                      }
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">JPG/PNG/WebP up to 15 MB or MP4/WebM up to 250 MB.</p>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Media type">
                  <select required value={draft.mediaType ?? ""} onChange={(event) => update("mediaType", event.target.value as CmsMediaType || null)} className={inputClass}>
                    <option value="">Choose type</option><option value="IMAGE">Image</option><option value="VIDEO">Video</option>
                  </select>
                </Field>
                <Field label="Display order">
                  <input type="number" min={0} max={100000} value={draft.displayOrder} onChange={(event) => update("displayOrder", Number(event.target.value))} className={inputClass} />
                </Field>
              </div>
              <Field label="Thumbnail / video poster URL">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="url" value={draft.thumbnailUrl ?? ""} onChange={(event) => update("thumbnailUrl", event.target.value)} className={inputClass} placeholder="Required for videos; optional for images" />
                  <UploadField accept={imageAccept} label="Upload poster" disabled={uploading} onFile={(file) => void upload(file, "thumbnailUrl")} />
                  <MediaAssetPicker onSelect={(asset) => update("thumbnailUrl", asset.url)} />
                </div>
              </Field>
            </>
          )}
          {section === "blogs" && (
            <>
              <Field label="Excerpt">
                <textarea required maxLength={1000} rows={3} value={draft.excerpt ?? ""} onChange={(event) => update("excerpt", event.target.value)} className={`${inputClass} resize-y`} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Author">
                  <input required maxLength={160} value={draft.author ?? ""} onChange={(event) => update("author", event.target.value)} className={inputClass} />
                </Field>
                <Field label="Publication date">
                  <input type="date" value={draft.publicationDate ?? ""} onChange={(event) => update("publicationDate", event.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="Cover image URL">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="url" value={draft.coverImageUrl ?? ""} onChange={(event) => update("coverImageUrl", event.target.value)} className={inputClass} placeholder="https://…" />
                  <UploadField accept={imageAccept} label="Upload cover" disabled={uploading} onFile={(file) => void upload(file, "coverImageUrl")} />
                  <MediaAssetPicker onSelect={(asset) => update("coverImageUrl", asset.url)} />
                </div>
              </Field>
              <Field label="Article body">
                <CmsRichTextEditor value={draft.body ?? ""} onChange={(value) => update("body", value)} />
              </Field>
            </>
          )}
          <Field label="Publication status">
            <select value={draft.status} onChange={(event) => update("status", event.target.value as ProjectStatus)} className={inputClass}>
              <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option>
            </select>
          </Field>
          {((section === "tutorials" && draft.thumbnailUrl) || (section === "ads-videos" && draft.mediaUrl) || (section === "blogs" && draft.coverImageUrl)) && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <MediaAssetPreview
                asset={{
                  url: (section === "tutorials"
                    ? draft.thumbnailUrl
                    : section === "ads-videos"
                      ? draft.thumbnailUrl || draft.mediaUrl
                      : draft.coverImageUrl) ?? "",
                  mediaType: section === "ads-videos" && !draft.thumbnailUrl
                    ? draft.mediaType ?? "IMAGE"
                    : "IMAGE",
                  contentType: draft.mediaType === "VIDEO" && !draft.thumbnailUrl
                    ? "video/mp4"
                    : "image/jpeg",
                  originalFilename: "Content image preview",
                }}
                className="max-h-64 w-full object-contain"
              />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <button type="button" disabled={uploading} onClick={() => {
              if (mode === "edit" && itemId) {
                window.open(`/admin/${section}/${itemId}/preview`, "_blank", "noopener,noreferrer");
              } else {
                setError("Save this content as a draft first, then open its preview from the content list.");
              }
            }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:text-white disabled:opacity-50">
              <ExternalLink size={15} /> Preview
            </button>
            <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">
              {uploading ? <Upload size={15} className="animate-pulse" /> : <Save size={15} />}
              {saving ? "Saving..." : uploading ? "Uploading..." : "Save content"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-zinc-200">
      <span>{label}</span>
      {children}
    </label>
  );
}

function UploadField({
  accept,
  label,
  disabled,
  onFile,
}: {
  accept: string;
  label: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-zinc-200 transition hover:border-violet-400/40 hover:text-white ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <Upload size={14} /> {label}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = "";
        }}
        className="sr-only"
      />
    </label>
  );
}
