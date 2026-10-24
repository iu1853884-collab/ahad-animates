import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#060608] px-6 py-10 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <Link
            href="/"
            className="flex items-center text-sm font-bold tracking-tight text-zinc-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <span>AHAD</span>
            <span className="text-violet-400">.</span>
            <span className="ml-2 text-xs font-medium tracking-[0.25em] text-zinc-500">
              ANIMATES
            </span>
          </Link>
          <p className="text-center text-xs text-zinc-500 sm:text-left">
            3D visualization, CGI, and animation from Islamabad, Pakistan.
          </p>
        </div>

        <div className="flex flex-col items-center gap-5 sm:items-end">
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-zinc-400 sm:justify-end"
          >
            <Link
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="/portfolio"
            >
              Work
            </Link>
            <Link
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="/daily-work"
            >
              Daily Work
            </Link>
            <Link
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="/services"
            >
              Services
            </Link>
            <Link
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="/about"
            >
              About
            </Link>
            <Link
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="/tutorials"
            >
              Tutorials
            </Link>
            <Link
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="/ads"
            >
              Ads &amp; Videos
            </Link>
            <Link
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="/blog"
            >
              Blog
            </Link>
            <Link
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="/contact"
            >
              Contact
            </Link>
            <a
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="https://ahadanimates.com/connect-with-me/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Connect
            </a>
            <a
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="https://ahadanimates.com/contact/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Page
            </a>
            <a
              className="transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href="https://ahadanimates.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ahad Animates official website (opens in a new tab)"
            >
              Website
            </a>
          </nav>
          <nav
            aria-label="Social media"
            className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-500 sm:justify-end"
          >
            <a
              href="https://www.youtube.com/@Ahadanimates"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ahad Animates on YouTube"
              className="rounded transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              YouTube
            </a>
            <a
              href="https://www.instagram.com/ahad_animates"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ahad Animates on Instagram"
              className="rounded transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/AhadAnimatess"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ahad Animates on Facebook"
              className="rounded transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Facebook
            </a>
            <a
              href="https://www.tiktok.com/@ahadanimates"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ahad Animates on TikTok"
              className="rounded transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              TikTok
            </a>
            <a
              href="https://www.linkedin.com/in/ahadanimates"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ahad Animates on LinkedIn"
              className="rounded transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              LinkedIn
            </a>
            <a
              href="https://www.behance.net/Ahadanimates"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ahad Animates on Behance"
              className="rounded transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Behance
            </a>
          </nav>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-7xl text-center text-[11px] text-zinc-600 sm:text-left">
        &copy; 2026 Ahad Animates. All rights reserved.
      </p>
    </footer>
  );
}
