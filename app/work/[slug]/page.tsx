import { Suspense } from "react";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import CaseStudyContent from "./CaseStudyContent";

function CaseStudyLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08080b] px-6 text-white">
      <p className="text-sm text-zinc-400" role="status">
        Loading case study...
      </p>
    </main>
  );
}

export default function WorkCaseStudyPage() {
  return (
    <PublicPageShell>
      <Suspense fallback={<CaseStudyLoading />}>
        <CaseStudyContent />
      </Suspense>
    </PublicPageShell>
  );
}
