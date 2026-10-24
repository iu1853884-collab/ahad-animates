"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowDown, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative mx-auto grid min-h-[min(900px,calc(100svh-5rem))] max-w-7xl items-center gap-12 px-6 py-14 sm:py-16 md:grid-cols-2 md:gap-16 md:px-12 md:py-24"
    >
      <div className="relative z-10 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-violet-400/25 bg-violet-500/[0.08] px-4 py-2 text-xs font-medium tracking-[0.2em] text-violet-200"
        >
          <Sparkles size={14} className="text-violet-400" />
          <span>3D ART &bull; CGI &bull; PRODUCT VISUALS</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[clamp(3.25rem,8vw,6.75rem)] font-black leading-[0.98] tracking-[-0.065em]"
        >
          Products,
          <br />
          <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
            reimagined.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-7 max-w-xl text-base leading-8 text-zinc-300 sm:mt-8 sm:text-lg sm:leading-8"
        >
          Premium 3D product visualization, luxury fragrance imagery, and
          cinematic CGI advertising for e-commerce and commercial brands.
          Elevate your brand with stunning 3D animation.
        </motion.p>

        <p className="mt-3 text-xs font-semibold tracking-wide text-violet-200">
          Abdul Ahad <span className="text-zinc-600">·</span> CEO &amp; Founder
          <span className="text-zinc-600"> · </span>
          Pakistan&apos;s Youngest 3D Artist
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <a
            href="#work"
            className="aa-button aa-button-primary rounded-full px-7 py-4 text-sm"
          >
            Explore projects <ArrowRight size={16} />
          </a>
          <a
            href="#contact"
            className="aa-button aa-button-secondary rounded-full px-7 py-4 text-sm"
          >
            Start a project
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-xs font-semibold tracking-[0.18em] text-zinc-400"
        >
          <span>PRODUCT VISUALIZATION</span>
          <span className="text-zinc-600">&bull;</span>
          <span>CGI ADVERTISING</span>
          <span className="text-zinc-600">&bull;</span>
          <span>3D ANIMATION</span>
        </motion.div>
      </div>

      {/* Hero Image Column */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="relative z-10 mx-auto w-full max-w-md lg:max-w-lg"
      >
        {/* Layered glowing backlight */}
        <div
          className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-violet-600/30 to-fuchsia-600/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-zinc-900/60 shadow-[0_35px_100px_-35px_rgba(56,158,201,0.35)] backdrop-blur-sm transition duration-500 hover:border-violet-400/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-perfume.jpg"
            alt="Ahad Animates 3D perfume product visualization render"
            fetchPriority="high"
            className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
          />
          {/* Subtle glass badge overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">
                PRODUCT VISUALIZATION
              </p>
              <p className="text-xs font-medium text-zinc-200">
                Luxury perfume render
              </p>
            </div>
            <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">
              Blender CGI
            </span>
          </div>
        </div>
      </motion.div>

      {/* Bottom subtle indicator */}
      <div
        className="pointer-events-none absolute bottom-4 right-12 hidden items-center gap-3 text-xs tracking-widest text-zinc-500 md:flex"
        aria-hidden="true"
      >
        <ArrowDown size={14} className="animate-bounce text-violet-400" />
        <span>SCROLL TO EXPLORE</span>
      </div>
    </section>
  );
}
