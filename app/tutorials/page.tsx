import { ArrowRight, ExternalLink } from "lucide-react";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { PublicCmsListing } from "@/components/cms/PublicCmsListing";

const videos = [
  {
    title: "How To Download And Install Blender 3 On Windows 10/11",
    href: "https://www.youtube.com/watch?v=fcq_c2ARkdo",
  },
  {
    title: "Make This Awesome animation in Blender",
    href: "https://www.youtube.com/watch?v=kMtPN0gB5jI",
  },
  {
    title: "I Made An Awesome Animation In Just 15 Minutes! Blender Tutorials In Hindi Urdu",
    href: "https://www.youtube.com/watch?v=34YJbxdWcuI",
  },
  {
    title: "3D Animation Complete Crash Course For Beginners 2025",
    href: "https://www.youtube.com/watch?v=7bEjpq2O-PU",
  },
  {
    title: "A To Z 3D Product Ads in Blender – The Easiest Method!",
    href: "https://www.youtube.com/watch?v=fyf0Hrl_8BI",
  },
];

const channelTopics = [
  "NeuralD review and AI 3D modeling",
  "Embossed perfume caps in Blender",
  "Dior Loop animation breakdown",
  "Maaz Safder and Higgsfield AI video workflow",
];

export default function TutorialsPage() {
  return (
    <PublicPageShell>
      <main className="mx-auto min-h-[60vh] max-w-7xl px-6 py-20 md:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400">
          LEARN WITH AHAD ANIMATES
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
          Blender tutorials &amp; 3D learning
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
          Verified tutorials from the official Ahad Animates channel, covering
          Blender setup, animation, and product advertising.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://www.youtube.com/@Ahadanimates"
            target="_blank"
            rel="noopener noreferrer"
            className="aa-button aa-button-primary rounded-full px-5 py-3 text-xs tracking-wider"
          >
            YouTube channel
            <ArrowRight size={14} aria-hidden="true" />
          </a>
          <a
            href="https://www.youtube.com/playlist?list=PLczqtsQOvnA65AbQnMPA3bA5nBQamDslu"
            target="_blank"
            rel="noopener noreferrer"
            className="aa-button aa-button-secondary rounded-full px-5 py-3 text-xs tracking-wider"
          >
            Watch tutorials
          </a>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-2">
          {videos.map((video) => (
            <li key={video.href}>
              <a
                href={video.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm font-medium leading-6 text-zinc-200 transition hover:border-violet-400/40 hover:bg-violet-500/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span>{video.title}</span>
                <ExternalLink
                  size={15}
                  className="shrink-0 text-violet-300"
                />
              </a>
            </li>
          ))}
        </ul>
        <section className="mt-14" aria-labelledby="channel-topics-heading">
          <h2
            id="channel-topics-heading"
            className="text-lg font-semibold text-white"
          >
            More topics from the channel
          </h2>
          <ul className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
            {channelTopics.map((topic) => (
              <li
                key={topic}
                className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3"
              >
                {topic}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-16" aria-labelledby="published-tutorials-heading">
          <h2 id="published-tutorials-heading" className="text-2xl font-bold text-white">
            Published tutorials
          </h2>
          <PublicCmsListing section="tutorials" />
        </section>
      </main>
    </PublicPageShell>
  );
}
