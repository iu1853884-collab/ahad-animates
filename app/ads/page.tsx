import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { PublicCmsListing } from "@/components/cms/PublicCmsListing";

export default function AdsGalleryPage() {
  return (
    <PublicPageShell>
      <main className="mx-auto min-h-[60vh] max-w-7xl px-6 py-20 md:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400">Campaigns &amp; CGI</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Ads &amp; Videos</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">Published advertising images and video showcases.</p>
        <PublicCmsListing section="ads-videos" />
      </main>
    </PublicPageShell>
  );
}
