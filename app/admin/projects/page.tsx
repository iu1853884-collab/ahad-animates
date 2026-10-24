"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ProjectVideo } from "@/components/portfolio/ProjectVideo";
import { MediaAssetPicker } from "@/components/admin/MediaAssetPicker";
import { MediaAssetPreview } from "@/components/admin/MediaAssetPreview";
import { hasSafeVideoUrl } from "@/lib/video";
import {
  API_BASE_URL,
  apiCreateProject,
  apiDeleteProject,
  apiGetAdminProjects,
  apiGetMe,
  apiUpdateProject,
  apiUpdateProjectStatus,
  apiUploadCmsMedia,
  type CmsMediaAsset,
  type ProjectInput,
  type ProjectRecord,
  type ProjectStatus,
} from "@/lib/api";

type ProjectDraft = Omit<ProjectInput, "description" | "videoUrl"> & {
  description: string;
  videoUrl: string;
};

const emptyDraft: ProjectDraft = {
  title: "",
  slug: "",
  description: "",
  category: "",
  thumbnailUrl: "",
  projectUrl: "",
  videoUrl: "",
  featured: false,
  status: "DRAFT",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isValidHttpUrl(value: string) {
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

function isValidThumbnail(value: string) {
  return (
    isValidHttpUrl(value) &&
    value.trim().toLowerCase().startsWith("https://")
  ) || (
    value.startsWith("/images/") &&
    !value.includes("..") &&
    /^\/images\/[A-Za-z0-9._/-]+$/.test(value)
  ) || isValidUploadedMediaUrl(value);
}

function isValidUploadedMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return url.origin === new URL(API_BASE_URL).origin
      && /^\/api\/public\/media\/[1-9]\d*$/.test(url.pathname);
  } catch {
    return false;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function AdminProjectsPage({
  routeIsNew = false,
  routeEditId,
}: {
  routeIsNew?: boolean;
  routeEditId?: string;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#070709] text-sm text-zinc-400">
          Loading portfolio manager...
        </main>
      }
    >
      <AdminProjectsPageContent
        routeIsNew={routeIsNew}
        routeEditId={routeEditId}
      />
    </Suspense>
  );
}

function AdminProjectsPageContent({
  routeIsNew,
  routeEditId,
}: {
  routeIsNew: boolean;
  routeEditId?: string;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const items = await apiGetAdminProjects({
        category: categoryFilter,
        status: statusFilter,
      });
      setProjects(items);
      setError(null);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load projects."
      );
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    let isMounted = true;
    apiGetMe()
      .then((user) => {
        if (!isMounted) return;
        if (user.role !== "ROLE_ADMIN") {
          router.replace("/admin/login");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => {
        if (isMounted) router.replace("/admin/login");
      })
      .finally(() => {
        if (isMounted) setAuthLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    let isMounted = true;
    apiGetAdminProjects({
      category: categoryFilter,
      status: statusFilter,
    })
      .then((items) => {
        if (isMounted) {
          setProjects(items);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load projects."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authorized, categoryFilter, statusFilter]);

  const openCreateForm = () => {
    setEditingProject(null);
    setDraft(emptyDraft);
    setSlugTouched(false);
    setFormError(null);
    setSuccessMessage(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingProject(null);
    setFormOpen(false);
    setFormError(null);
    router.replace("/admin/projects");
  };

  const routeEditingProject = routeEditId
    ? projects.find((item) => item.id === Number(routeEditId)) ?? null
    : null;
  const activeEditingProject = editingProject ?? routeEditingProject;
  const formDraft =
    !formOpen && routeEditingProject
      ? {
          title: routeEditingProject.title,
          slug: routeEditingProject.slug,
          description: routeEditingProject.description ?? "",
          category: routeEditingProject.category,
          thumbnailUrl: routeEditingProject.thumbnailUrl,
          projectUrl: routeEditingProject.projectUrl,
          videoUrl: routeEditingProject.videoUrl ?? "",
          featured: routeEditingProject.featured,
          status: routeEditingProject.status,
        }
      : draft;
  const isFormVisible =
    formOpen || routeIsNew || Boolean(routeEditingProject);
  const isRouteEditor = routeIsNew || Boolean(routeEditId);
  const updateFormDraft = (nextDraft: ProjectDraft) => {
    setDraft(nextDraft);
    setFormOpen(true);
    if (routeEditingProject && !editingProject) {
      setEditingProject(routeEditingProject);
      setSlugTouched(true);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setError(null);
    setSuccessMessage(null);
    if (!isValidThumbnail(formDraft.thumbnailUrl)) {
      setFormError("Use an HTTPS thumbnail URL, a local /images/ path, or a media-library image.");
      return;
    }
    if (!isValidHttpUrl(formDraft.projectUrl)) {
      setFormError("Project URL must be a valid HTTP or HTTPS link.");
      return;
    }
    if (formDraft.videoUrl && !isValidHttpUrl(formDraft.videoUrl)) {
      setFormError("Video URL must be a valid HTTP or HTTPS link.");
      return;
    }

    const payload: ProjectInput = {
      ...formDraft,
      description: formDraft.description.trim() || null,
      videoUrl: formDraft.videoUrl.trim() || null,
    };
    setSaving(true);
    try {
      if (activeEditingProject) {
        await apiUpdateProject(activeEditingProject.id, payload);
        setSuccessMessage("Project updated successfully.");
      } else {
        await apiCreateProject(payload);
        setSuccessMessage("Project created successfully.");
      }
      if (!isRouteEditor) closeForm();
      await loadProjects();
    } catch (requestError: unknown) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this project."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (project: ProjectRecord) => {
    const nextStatus = project.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setError(null);
    setSuccessMessage(null);
    try {
      await apiUpdateProjectStatus(project.id, nextStatus);
      setSuccessMessage(
        nextStatus === "PUBLISHED"
          ? "Project published successfully."
          : "Project moved to drafts."
      );
      await loadProjects();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update project status."
      );
    }
  };

  const handleDelete = async (project: ProjectRecord) => {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
      return;
    }
    setError(null);
    setSuccessMessage(null);
    try {
      await apiDeleteProject(project.id);
      setSuccessMessage("Project deleted successfully.");
      await loadProjects();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this project."
      );
    }
  };

  const categories = [...new Set(projects.map((project) => project.category))];
  const visibleProjects = projects.filter((project) => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return (
      !query ||
      project.title.toLocaleLowerCase().includes(query) ||
      project.slug.toLocaleLowerCase().includes(query) ||
      project.category.toLocaleLowerCase().includes(query)
    );
  });

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
              <h1 className="mt-1 text-lg font-semibold">Portfolio projects</h1>
            </div>
          </div>
          <Link
            href="/admin/projects/new"
            className="aa-button aa-button-primary rounded-xl px-4 py-2.5 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add project</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Your work, curated
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Manage projects
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Draft and publish portfolio work. Published projects are visible
              to visitors; drafts remain private.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="sr-only" htmlFor="project-search">
              Search projects
            </label>
            <input
              id="project-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search projects"
              className="min-w-52 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-violet-400"
            />
            <label className="sr-only" htmlFor="category-filter">
              Filter by category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(event) => {
                setLoading(true);
                setCategoryFilter(event.target.value);
              }}
              className="min-w-44 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="status-filter">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                {
                  setLoading(true);
                  setStatusFilter(event.target.value as ProjectStatus | "");
                }
              }
              className="min-w-36 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            className="mb-5 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}
        {successMessage && (
          <p
            className="mb-5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            {successMessage}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
            <h3 className="text-sm font-semibold text-white">All projects</h3>
            <span className="text-xs text-zinc-500">
              {visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}
            </span>
          </div>

          {loading ? (
            <p className="px-6 py-16 text-center text-sm text-zinc-400" role="status">
              Loading projects...
            </p>
          ) : visibleProjects.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-zinc-300">No projects match these filters.</p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-4 text-sm font-medium text-violet-300 hover:text-violet-200"
              >
                Add your first project
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {visibleProjects.map((project) => (
                <article
                  key={project.id}
                  className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.thumbnailUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl border border-white/10 bg-zinc-950 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-semibold text-white">
                          {project.title}
                        </h4>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            project.status === "PUBLISHED"
                              ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300"
                              : "border-amber-400/25 bg-amber-400/[0.08] text-amber-200"
                          }`}
                        >
                          {project.status}
                        </span>
                        {project.featured && (
                          <span className="rounded-full border border-violet-400/25 bg-violet-400/[0.08] px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                            FEATURED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {project.category} <span className="px-1.5 text-zinc-600">·</span>{" "}
                        {project.slug}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-600">
                        Updated {formatDate(project.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${project.title} project link`}
                      className="rounded-lg border border-white/10 p-2.5 text-zinc-400 transition hover:border-white/25 hover:text-white"
                    >
                      <ExternalLink size={15} />
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleStatusChange(project)}
                      className={`aa-button min-h-10 rounded-lg px-3 py-2 text-xs ${project.status === "PUBLISHED" ? "aa-button-outline" : "aa-button-primary"}`}
                    >
                      {project.status === "PUBLISHED" ? "Set to draft" : "Publish"}
                    </button>
                    <Link
                      href={`/admin/projects/${project.id}/edit`}
                      aria-label={`Edit ${project.title}`}
                      className="rounded-lg border border-white/10 p-2.5 text-zinc-400 transition hover:border-violet-400/40 hover:text-white"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project)}
                      aria-label={`Delete ${project.title}`}
                      className="rounded-lg border border-white/10 p-2.5 text-zinc-400 transition hover:border-red-400/40 hover:text-red-300"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {routeEditId && !loading && !routeEditingProject && !error && (
        <p role="alert" className="mx-auto max-w-7xl px-5 pb-6 text-sm text-red-200 sm:px-8">
          That project could not be found in the current admin project list.
        </p>
      )}

      {isFormVisible && (
        <ProjectForm
          draft={formDraft}
          setDraft={updateFormDraft}
          editing={Boolean(activeEditingProject)}
          slugTouched={slugTouched}
          onSlugTouched={() => setSlugTouched(true)}
          error={formError}
          success={isRouteEditor ? successMessage : null}
          saving={saving}
          onClose={closeForm}
          onSubmit={handleSave}
        />
      )}
    </main>
  );
}

function ProjectForm({
  draft,
  setDraft,
  editing,
  slugTouched,
  onSlugTouched,
  error,
  success,
  saving,
  onClose,
  onSubmit,
}: {
  draft: ProjectDraft;
  setDraft: (draft: ProjectDraft) => void;
  editing: boolean;
  slugTouched: boolean;
  onSlugTouched: () => void;
  error: string | null;
  success: string | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const update = <K extends keyof ProjectDraft>(
    key: K,
    value: ProjectDraft[K]
  ) => setDraft({ ...draft, [key]: value });
  const uploadThumbnail = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMediaError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setMediaError("Images must be 15 MB or smaller.");
      return;
    }
    setUploadingMedia(true);
    setMediaError(null);
    try {
      const asset: CmsMediaAsset = await apiUploadCmsMedia(file);
      update("thumbnailUrl", asset.url);
    } catch (uploadError: unknown) {
      setMediaError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploadingMedia(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        className="my-auto max-h-[96vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#101014] p-5 shadow-2xl shadow-black/50 sm:rounded-2xl sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">
              Portfolio editor
            </p>
            <h2 id="project-form-title" className="mt-1 text-xl font-semibold">
              {previewOpen
                ? "Project preview"
                : editing
                  ? "Edit project"
                  : "Add project"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen((current) => !current)}
              className="rounded-lg border border-violet-400/25 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:border-violet-400/50 hover:bg-violet-400/[0.08]"
              aria-pressed={previewOpen}
            >
              {previewOpen ? "Back to editor" : "Preview"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close project form"
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {success && (
          <p
            className="mb-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            {success}
          </p>
        )}

        {previewOpen ? (
          <article className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                {draft.category.trim() || "Category"}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                  draft.status === "PUBLISHED"
                    ? "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-200"
                    : "border-amber-400/30 bg-amber-400/[0.06] text-amber-200"
                }`}
              >
                {draft.status === "PUBLISHED" ? "Published" : "Draft preview"}
              </span>
              {draft.featured && (
                <span className="rounded-full border border-violet-400/30 bg-violet-400/[0.06] px-2.5 py-1 text-[10px] font-semibold text-violet-200">
                  Featured
                </span>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {draft.title.trim() || "Untitled project"}
              </h3>
              {draft.description.trim() && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                  {draft.description.trim()}
                </p>
              )}
            </div>

            {isValidThumbnail(draft.thumbnailUrl) ? (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                {isValidUploadedMediaUrl(draft.thumbnailUrl) ? (
                  <MediaAssetPreview
                    asset={{
                      url: draft.thumbnailUrl,
                      mediaType: "IMAGE",
                      contentType: "image/jpeg",
                      originalFilename: `${draft.title.trim() || "Project"} preview`,
                    }}
                    className="max-h-[45vh] w-full object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.thumbnailUrl}
                    alt={`${draft.title.trim() || "Project"} preview`}
                    className="max-h-[45vh] w-full object-contain"
                  />
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-4 py-3 text-xs text-amber-200">
                Add a valid thumbnail URL to preview the project image.
              </p>
            )}

            {hasSafeVideoUrl(draft.videoUrl) ? (
              <ProjectVideo
                videoUrl={draft.videoUrl}
                title={draft.title.trim() || "Project"}
                posterUrl={draft.thumbnailUrl}
              />
            ) : draft.videoUrl.trim() ? (
              <p className="text-xs text-zinc-500">
                This video URL is not from a supported provider and will not be embedded.
              </p>
            ) : null}

            {isValidHttpUrl(draft.projectUrl) && (
              <a
                href={draft.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-violet-200 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Open external project link
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
            <p className="border-t border-white/[0.08] pt-4 text-xs text-zinc-500">
              This preview reflects unsaved form data. Saving as a draft keeps the project private.
            </p>
          </article>
        ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="project-title">
              <input
                id="project-title"
                required
                minLength={2}
                maxLength={160}
                value={draft.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setDraft({
                    ...draft,
                    title,
                    ...(!editing && !slugTouched ? { slug: slugify(title) } : {}),
                  });
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Slug" htmlFor="project-slug">
              <input
                id="project-slug"
                required
                maxLength={180}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Use lowercase letters and numbers separated by single hyphens."
                value={draft.slug}
                onChange={(event) => {
                  onSlugTouched();
                  update("slug", event.target.value);
                }}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Category" htmlFor="project-category">
            <input
              id="project-category"
              required
              maxLength={100}
              value={draft.category}
              onChange={(event) => update("category", event.target.value)}
              className={inputClass}
              placeholder="e.g. Product Visualization"
            />
          </Field>

          <Field label="Description (optional)" htmlFor="project-description">
            <textarea
              id="project-description"
              maxLength={5000}
              rows={3}
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
              className={`${inputClass} resize-y`}
              placeholder="Add verified project details when ready."
            />
          </Field>

          <Field label="Thumbnail URL" htmlFor="project-thumbnail">
            <input
              id="project-thumbnail"
              required
              maxLength={2048}
              value={draft.thumbnailUrl}
              onChange={(event) => update("thumbnailUrl", event.target.value)}
              className={inputClass}
              placeholder="HTTPS URL, /images/ path, or uploaded asset"
              aria-describedby="thumbnail-help"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:border-violet-400/40 hover:text-white ${uploadingMedia ? "pointer-events-none opacity-60" : ""}`}>
                <Upload size={14} aria-hidden="true" />
                {uploadingMedia ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-label="Upload project thumbnail"
                  disabled={uploadingMedia}
                  onChange={(event) => void uploadThumbnail(event)}
                />
              </label>
              <MediaAssetPicker
                onSelect={(asset) => {
                  update("thumbnailUrl", asset.url);
                  setMediaError(null);
                }}
              />
            </div>
            <p id="thumbnail-help" className="mt-1.5 text-[11px] text-zinc-500">
              Select an existing image or upload a JPG, PNG, or WebP image (up to 15 MB).
            </p>
            {mediaError && <p role="alert" className="mt-2 text-xs text-red-200">{mediaError}</p>}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project URL" htmlFor="project-url">
              <input
                id="project-url"
                required
                maxLength={2048}
                value={draft.projectUrl}
                onChange={(event) => update("projectUrl", event.target.value)}
                className={inputClass}
                placeholder="https://…"
              />
            </Field>
            <Field label="Video URL (optional)" htmlFor="project-video">
              <input
                id="project-video"
                maxLength={2048}
                value={draft.videoUrl}
                onChange={(event) => update("videoUrl", event.target.value)}
                className={inputClass}
                placeholder="https://…"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Visibility" htmlFor="project-status">
              <select
                id="project-status"
                value={draft.status}
                onChange={(event) =>
                  update("status", event.target.value as ProjectStatus)
                }
                className={inputClass}
              >
                <option value="DRAFT">Draft — private</option>
                <option value="PUBLISHED">Published — public</option>
              </select>
            </Field>
            <label className="flex items-center gap-3 self-end rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(event) => update("featured", event.target.checked)}
                className="h-4 w-4 accent-violet-500"
              />
              Feature this project
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Save project"}
            </button>
          </div>
        </form>
        )}
      </section>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400";

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
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium text-zinc-300"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
