import { Suspense } from "react";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import CaseStudyContent from "@/app/work/[slug]/CaseStudyContent";

function CaseStudyLoading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 text-white">
      <p className="text-sm text-zinc-400" role="status">
        Loading case study...
      </p>
    </main>
  );
}

export default function PortfolioCaseStudyPage() {
  return (
    <PublicPageShell>
      <Suspense fallback={<CaseStudyLoading />}>
        <CaseStudyContent />
      </Suspense>
    </PublicPageShell>
  );
}
