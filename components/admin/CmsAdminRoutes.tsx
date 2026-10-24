"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { CmsContentManager } from "@/components/admin/CmsContentManager";
import { CmsPreview } from "@/components/admin/CmsPreview";
import type { CmsSection } from "@/lib/api";

export function CmsCreateRoute({ section }: { section: CmsSection }) {
  return <CmsContentManager section={section} mode="new" />;
}

export function CmsEditRoute({ section }: { section: CmsSection }) {
  const params = useParams<{ id: string }>();
  const itemId = Number(params.id);
  return (
    <CmsContentManager
      section={section}
      mode="edit"
      itemId={Number.isSafeInteger(itemId) && itemId > 0 ? itemId : undefined}
    />
  );
}

export function CmsEditPage({ section }: { section: CmsSection }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <CmsEditRoute section={section} />
    </Suspense>
  );
}

export function CmsPreviewPage({ section }: { section: CmsSection }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <CmsPreview section={section} />
    </Suspense>
  );
}

function RouteLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070709] text-sm text-zinc-400" role="status">
      Loading content...
    </main>
  );
}
