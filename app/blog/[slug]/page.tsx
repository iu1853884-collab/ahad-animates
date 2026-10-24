import { Suspense } from "react";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { PublicCmsDetail } from "@/components/cms/PublicCmsDetail";

export default function BlogDetailPage() {
  return (
    <PublicPageShell>
      <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-zinc-950" />}>
        <PublicCmsDetail section="blogs" />
      </Suspense>
    </PublicPageShell>
  );
}
