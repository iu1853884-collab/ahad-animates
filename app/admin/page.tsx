"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiGetAdminCmsContent,
  apiGetAdminProjects,
  apiGetMe,
  apiLogout,
  type AuthUser,
  type CmsContentRecord,
  type CmsSection,
} from "@/lib/api";

function countRows(items: CmsContentRecord[] | Awaited<ReturnType<typeof apiGetAdminProjects>>) {
  return {
    total: items.length,
    published: items.filter((item) => item.status === "PUBLISHED").length,
    drafts: items.filter((item) => item.status === "DRAFT").length,
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "portfolio" | "timeline" | "inquiries" | "settings">("overview");
  const [projectCounts, setProjectCounts] = useState<{
    total: number;
    published: number;
    drafts: number;
  } | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [cmsCounts, setCmsCounts] = useState<Record<CmsSection, {
    total: number;
    published: number;
    drafts: number;
  }> | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiGetMe()
      .then((data) => {
        if (isMounted) {
          if (data.role !== "ROLE_ADMIN") {
            router.replace("/admin/login");
            return;
          }
          setUser(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          router.replace("/admin/login");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    Promise.all([
      apiGetAdminProjects(),
      apiGetAdminCmsContent("tutorials"),
      apiGetAdminCmsContent("ads-videos"),
      apiGetAdminCmsContent("blogs"),
    ])
      .then(([projects, tutorials, adsVideos, blogs]) => {
        if (!isMounted) return;
        setProjectCounts(countRows(projects));
        setCmsCounts({
          tutorials: countRows(tutorials),
          "ads-videos": countRows(adsVideos),
          blogs: countRows(blogs),
        });
        setCountsError(null);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setCountsError(
          error instanceof Error ? error.message : "Unable to load project counts."
        );
      })
      .finally(() => {
        if (isMounted) setCountsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await apiLogout();
      router.replace("/admin/login");
    } catch {
      setLogoutError("Logout could not be confirmed by the backend. Check your connection and try again.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070709] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm tracking-wide">Validating administrator session...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href="/"
              className="text-xs font-semibold tracking-wider text-zinc-400 hover:text-white transition-colors"
            >
              AHAD ANIMATES
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-sm font-medium text-white flex items-center gap-2">
              <span>Admin Console</span>
              <span className="bg-purple-900/40 text-purple-300 border border-purple-700/50 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase">
                {user?.role || "ROLE_ADMIN"}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link
              href="/admin/projects/new"
              className="aa-button aa-button-primary min-h-10 rounded-lg px-3.5 py-2 text-xs"
            >
              Add project
            </Link>
            <Link
              href="/admin/projects"
              className="aa-button aa-button-outline min-h-10 rounded-lg px-3.5 py-2 text-xs"
            >
              Manage projects
            </Link>
            <Link href="/admin" className="rounded-lg border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:border-violet-400/40 hover:text-white">Dashboard</Link>
            <Link
              href="/admin/daily-work"
              className="rounded-lg border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:border-violet-400/40 hover:text-white"
            >
              Daily Work
            </Link>
            <Link href="/admin/tutorials" className="rounded-lg border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:border-violet-400/40 hover:text-white">Tutorials</Link>
            <Link href="/admin/ads-videos" className="rounded-lg border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:border-violet-400/40 hover:text-white">Ads &amp; Videos</Link>
            <Link href="/admin/blogs" className="rounded-lg border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:border-violet-400/40 hover:text-white">Blogs</Link>
            <Link href="/admin/media" className="rounded-lg border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:border-violet-400/40 hover:text-white">Media Library</Link>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-zinc-200">{user?.fullName || "Administrator"}</span>
              <span className="text-[11px] text-zinc-500 font-mono">{user?.email}</span>
            </div>

            <button
              id="admin-logout-btn"
              onClick={handleLogout}
              className="text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3.5 py-2 transition-all"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      {logoutError && (
        <p role="alert" className="mx-auto mt-4 w-full max-w-7xl px-4 text-sm text-red-200 sm:px-6">
          {logoutError}
        </p>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col gap-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800/80 gap-1 overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Overview & Status" },
            { id: "portfolio", label: "Portfolio Projects" },
            { id: "timeline", label: "Daily Work" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "portfolio" || tab.id === "timeline") {
                  router.push(tab.id === "portfolio" ? "/admin/projects" : "/admin/daily-work");
                } else {
                  setActiveTab(tab.id as typeof activeTab);
                }
              }}
              className={`px-4 py-2.5 text-xs font-medium tracking-wide transition-all whitespace-nowrap rounded-t-lg border-b-2 ${
                activeTab === tab.id
                  ? "border-purple-500 text-white bg-purple-950/20"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                Dashboard overview
              </h1>
              <p className="text-zinc-400 text-sm">
                Portfolio publishing is connected to the secured Spring Boot & PostgreSQL backend.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Total projects", value: projectCounts?.total },
                { label: "Published", value: projectCounts?.published },
                { label: "Drafts", value: projectCounts?.drafts },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5"
                >
                  <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {metric.label}
                  </span>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {countsLoading ? "…" : metric.value ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    From the secured projects API
                  </p>
                </div>
              ))}
            </div>
            {countsError && (
              <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">
                Project metrics could not be loaded: {countsError}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {([
                ["tutorials", "Tutorials"],
                ["ads-videos", "Ads & Videos"],
                ["blogs", "Blogs"],
              ] as const).map(([section, label]) => (
                <article key={section} className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-white">{label}</h2>
                    <Link href={`/admin/${section}`} className="text-xs text-violet-300 hover:text-violet-200">Manage</Link>
                  </div>
                  <p className="mt-4 text-2xl font-semibold">{countsLoading ? "…" : cmsCounts?.[section].total ?? "—"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {countsLoading ? "Loading totals…" : `${cmsCounts?.[section].published ?? "—"} published · ${cmsCounts?.[section].drafts ?? "—"} drafts`}
                  </p>
                  <Link href={`/admin/${section}/new`} className="mt-4 inline-flex items-center text-xs font-semibold text-violet-300 hover:text-white">Add {label.slice(0, -1)}</Link>
                </article>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/projects/new"
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Add project
              </Link>
              <Link
                href="/admin/projects"
                className="rounded-xl border border-white/10 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/40 hover:text-white"
              >
                Manage projects
              </Link>
            </div>

            {/* Strategic Roadmap Card */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-2">
                Strategic foundation status
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                The secure authentication architecture remains the authority for access control. Portfolio projects
                can now be managed and published from this console. Media uploads, blog management, and analytics
                remain outside this phase.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-lg">
                  <span className="font-semibold text-purple-400 block mb-1">Phase 2 (Current)</span>
                  <p className="text-zinc-400">Secure project CRUD, drafts, publishing & public portfolio data</p>
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-800/40 rounded-lg opacity-75">
                  <span className="font-semibold text-zinc-300 block mb-1">Later phase</span>
                  <p className="text-zinc-500">Media library and file uploads</p>
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-800/40 rounded-lg opacity-75">
                  <span className="font-semibold text-zinc-300 block mb-1">Future phases</span>
                  <p className="text-zinc-500">Client inquiry CRM and real-time analytics</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2-5: Placeholders indicating sequential phase structure */}
        {activeTab !== "overview" && (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-center justify-center text-purple-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Module ready for a later phase</h2>
            <p className="text-sm text-zinc-400 max-w-md">
              This module is reserved for a later project phase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
