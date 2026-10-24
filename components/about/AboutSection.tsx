"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  MapPin,
} from "lucide-react";

const specialties = [
  "3D Product Visualization",
  "CGI Advertising",
  "3D Animation",
  "Product Rendering",
  "Lighting & Materials",
];

type SocialPlatform =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "linkedin"
  | "behance";

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const iconProps = {
    "aria-hidden": true as const,
    className: "size-[18px] shrink-0",
    fill: "currentColor",
    viewBox: "0 0 24 24",
  };

  switch (platform) {
    case "youtube":
      return (
        <svg {...iconProps}>
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...iconProps} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...iconProps}>
          <path d="M19.6 5.2a5.5 5.5 0 0 1-3.3-3.3V1h-4.1v14.1a2.7 2.7 0 1 1-2.7-2.7c.5 0 .9.1 1.3.3V8.4a7 7 0 1 0 5.5 6.8V8a9.4 9.4 0 0 0 4.8 1.3V5.2h-1.5Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...iconProps}>
          <path d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1c0 6 4.4 11 10.1 11.9v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...iconProps}>
          <path d="M20.4 2H3.6C2.7 2 2 2.7 2 3.6v16.8c0 .9.7 1.6 1.6 1.6h16.8c.9 0 1.6-.7 1.6-1.6V3.6c0-.9-.7-1.6-1.6-1.6ZM7.9 18.7H4.8V9h3.1v9.7ZM6.3 7.7a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Zm13 11h-3.1V14c0-1.1 0-2.6-1.6-2.6s-1.9 1.2-1.9 2.5v4.8H9.6V9h3v1.3a3.3 3.3 0 0 1 2.9-1.6c3.1 0 3.7 2 3.7 4.5v5.5Z" />
        </svg>
      );
    case "behance":
      return (
        <svg {...iconProps} viewBox="0 0 32 24">
          <path d="M2 4h8.2c4 0 6.3 1.6 6.3 4.7 0 1.8-1 3.1-2.5 3.8 2.1.6 3.3 2.1 3.3 4.4 0 3.6-2.8 5.3-6.9 5.3H2V4Zm4.1 3.2v4h3.7c1.7 0 2.6-.6 2.6-2s-.9-2-2.6-2H6.1Zm0 7v4.8h4c1.9 0 2.9-.7 2.9-2.4 0-1.6-1-2.4-2.9-2.4h-4ZM21 8h7V5.5h-7V8Zm7.6 9.5h3.2c-.6 3.2-3.1 5.1-6.7 5.1-4.3 0-7-2.8-7-7.2 0-4.3 2.8-7.2 6.9-7.2 4.5 0 7 3.3 6.8 8h-10c.2 2.1 1.4 3.3 3.3 3.3 1.5 0 2.5-.7 2.9-2Zm-5.8-3.8h6.1c-.3-1.8-1.3-2.7-3-2.7-1.7 0-2.8 1-3.1 2.7Z" />
        </svg>
      );
  }
}

const socialLinkClass =
  "inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-100 bg-white px-3.5 py-2 text-xs font-semibold text-sky-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 active:translate-y-0";

export function AboutSection({ animateProfile = false }: { animateProfile?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [typewriterStarted, setTypewriterStarted] = useState(false);
  const [specialtyIndex, setSpecialtyIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!animateProfile || reduceMotion) return;

    const startTimer = window.setTimeout(() => setTypewriterStarted(true), 350);
    return () => window.clearTimeout(startTimer);
  }, [animateProfile, reduceMotion]);

  useEffect(() => {
    if (!animateProfile || !typewriterStarted || reduceMotion) return;

    const specialty = specialties[specialtyIndex];
    let timer: number;
    if (!deleting && typedText.length < specialty.length) {
      timer = window.setTimeout(
        () => setTypedText(specialty.slice(0, typedText.length + 1)),
        72,
      );
    } else if (!deleting) {
      timer = window.setTimeout(() => setDeleting(true), 1350);
    } else if (typedText.length > 0) {
      timer = window.setTimeout(
        () => setTypedText(typedText.slice(0, -1)),
        34,
      );
    } else {
      timer = window.setTimeout(() => {
        setSpecialtyIndex((current) => (current + 1) % specialties.length);
        setDeleting(false);
      }, 260);
    }

    return () => window.clearTimeout(timer);
  }, [animateProfile, deleting, reduceMotion, specialtyIndex, typedText, typewriterStarted]);

  return (
    <section
      id="about"
      className="relative overflow-hidden border-y border-white/10 bg-gradient-to-br from-white/[0.025] via-transparent to-violet-500/[0.035] px-6 py-12 sm:py-16 md:px-12 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
        <motion.div
          initial={
            animateProfile && !reduceMotion
              ? { opacity: 0, y: "-100vh", scale: 0.94 }
              : animateProfile
                ? false
                : { opacity: 0, x: -25 }
          }
          animate={
            animateProfile && !reduceMotion
              ? { opacity: 1, y: 0, scale: 1 }
              : undefined
          }
          whileInView={
            animateProfile ? undefined : { opacity: 1, x: 0 }
          }
          transition={
            animateProfile
              ? { duration: 0.95, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0.55 }
          }
          viewport={{ once: true }}
          className="relative mx-auto w-full max-w-[18rem] sm:max-w-md"
        >
          <div
            className="absolute -inset-8 rounded-[2.5rem] bg-violet-600/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-gradient-to-br from-violet-400/10 to-zinc-950 shadow-[0_35px_90px_-40px_rgba(56,158,201,0.38)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.people.connectedpakistan.pk/uploads/alumni/abdul-ahad.png"
              alt="Abdul Ahad, 3D artist and founder of Ahad Animates"
              loading={animateProfile ? "lazy" : "eager"}
              fetchPriority={animateProfile ? "auto" : "high"}
              className="aspect-[4/5] w-full object-cover object-top"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent p-5">
              <p className="text-sm font-bold text-white">Abdul Ahad</p>
              <p className="text-xs text-violet-300">
                CEO &amp; Founder
              </p>
            </div>
          </div>
          {animateProfile && (
            <div className="mt-5 min-h-10 text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                Creative specialties
              </p>
              <p
                className="mt-1 min-h-7 text-base font-semibold text-violet-200 sm:text-lg"
                aria-hidden="true"
              >
                {reduceMotion
                  ? specialties[0]
                  : typewriterStarted
                    ? typedText
                    : ""}
                {!reduceMotion && typewriterStarted && (
                  <span className="ml-0.5 inline-block h-[1.1em] w-px translate-y-0.5 animate-pulse bg-violet-300" />
                )}
              </p>
              <span className="sr-only">
                Specialties: {specialties.join(", ")}.
              </span>
            </div>
          )}
        </motion.div>

        <div>
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-violet-400 uppercase">
            MEET THE FOUNDER
          </p>

          <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-extrabold tracking-[-0.05em]">
            Abdul Ahad
          </h2>

          <p className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            <MapPin size={13} className="text-violet-300" />
            Islamabad, Pakistan
          </p>

          <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-200">
            Abdul Ahad is the CEO and founder of Ahad Animates, working as a 3D
            artist and animator in Islamabad. He began exploring 3D animation
            during the pandemic, inspired by a childhood love of cartoons and
            video games and encouraged by his parents.
          </p>

          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">
            His first big challenge was a simple Blender donut. For weeks, he
            learned through tutorials and worked through technical setbacks,
            motivated by his mother&apos;s promise of a toy car. Finishing that
            first project sparked a lasting passion for 3D animation.
          </p>

          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">
            Today, he creates product visualization, animation, and CGI
            advertising. His reported 3D artist work includes Shahid Anwer and
            ZamZam Perfumes Pakistan. He is available for freelance and
            full-time opportunities.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="https://people.connectedpakistan.pk/abdul-ahad"
              target="_blank"
              rel="noopener noreferrer"
              className="aa-button aa-button-secondary rounded-full px-6 py-3 text-xs tracking-wider"
            >
              <span>View public profile</span>
              <ExternalLink size={14} className="text-violet-400" />
            </a>
            <a
              href="/contact"
              className="aa-button aa-button-primary rounded-full px-6 py-3 text-xs tracking-wider"
            >
              <span>Get in touch</span>
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6 sm:gap-3">
            <a
              href="https://www.youtube.com/@Ahadanimates"
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
              aria-label="Abdul Ahad on YouTube (opens in a new tab)"
            >
              <SocialIcon platform="youtube" />
              <span>YouTube channel</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <a
              href="https://www.instagram.com/ahad_animates"
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
              aria-label="Abdul Ahad on Instagram (opens in a new tab)"
            >
              <SocialIcon platform="instagram" />
              <span>Instagram</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <a
              href="https://www.tiktok.com/@ahadanimates"
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
              aria-label="Abdul Ahad on TikTok (opens in a new tab)"
            >
              <SocialIcon platform="tiktok" />
              <span>TikTok</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <a
              href="https://www.facebook.com/AhadAnimatess"
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
              aria-label="Ahad Animates on Facebook (opens in a new tab)"
            >
              <SocialIcon platform="facebook" />
              <span>Facebook</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <a
              href="https://www.linkedin.com/in/ahadanimates"
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
              aria-label="Abdul Ahad on LinkedIn (opens in a new tab)"
            >
              <SocialIcon platform="linkedin" />
              <span>LinkedIn</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <a
              href="https://www.behance.net/Ahadanimates"
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
              aria-label="Ahad Animates on Behance (opens in a new tab)"
            >
              <SocialIcon platform="behance" />
              <span>Behance</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-7xl gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-white/10 bg-black/20 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">
            The vision
          </p>
          <h3 className="mt-3 text-2xl font-bold text-white">
            Stories from Pakistan with a global point of view
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            The vision is to help establish Pakistan as a global hub for
            high-quality 3D animation and creative visual production, while
            working toward CG movies and animated stories that inspire young
            minds and carry positive messages.
          </p>
          <h4 className="mt-7 text-sm font-semibold text-zinc-200">
            A mission to
          </h4>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-400 sm:grid-cols-2">
            <li>Engage audiences through high-quality 3D animation</li>
            <li>Encourage young people to explore 3D animation</li>
            <li>Showcase Pakistan&apos;s creative potential internationally</li>
            <li>Encourage and support aspiring artists</li>
            <li>Work toward producing high-quality CG movies</li>
          </ul>
        </article>

        <div className="grid gap-5">
          <article className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">
              Core values
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {["Focus", "Consistency", "Innovation", "Community"].map(
                (value) => (
                  <li
                    key={value}
                    className="rounded-full border border-violet-300/20 bg-violet-300/[0.06] px-3 py-1.5 text-xs font-medium text-violet-100"
                  >
                    {value}
                  </li>
                ),
              )}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">
              Learn with the studio
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Find Blender tutorials for beginner and advanced artists,
              product visualization guides, complete 3D animation crash
              courses, project breakdowns, behind-the-scenes work, and
              insights into AI-assisted 3D workflows from an educational
              resource for aspiring artists.
            </p>
            <h4 className="mt-4 text-xs font-semibold text-zinc-300">
              Topics from the channel
            </h4>
            <ul className="mt-2 grid gap-2 text-xs leading-5 text-zinc-400 sm:grid-cols-2">
              <li>NeuralD review and AI 3D modeling</li>
              <li>Embossed perfume caps in Blender</li>
              <li>Dior Loop animation behind the scenes</li>
              <li>
                AI video workflow for Maaz Safder using Higgsfield
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
              <a
                href="https://www.youtube.com/@Ahadanimates"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-200 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                YouTube channel
                <ArrowUpRight size={13} />
              </a>
              <a
                href="https://www.youtube.com/watch?v=fcq_c2ARkdo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-200 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                aria-label="Watch How To Download And Install Blender 3 On Windows 10/11, Blender Tutorial In English on YouTube"
              >
                How To Download And Install Blender 3 On Windows 10/11
                <ArrowUpRight size={13} />
              </a>
              <a
                href="https://www.youtube.com/watch?v=kMtPN0gB5jI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-200 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Make This Awesome animation in Blender
                <ArrowUpRight size={13} />
              </a>
              <a
                href="https://www.youtube.com/watch?v=34YJbxdWcuI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-200 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                I Made An Awesome Animation In Just 15 Minutes! Blender
                Tutorials In Hindi Urdu
                <ArrowUpRight size={13} />
              </a>
              <a
                href="https://www.youtube.com/watch?v=7bEjpq2O-PU"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-200 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                3D Animation Complete Crash Course For Beginners 2025 |
                Blender 3d Animation
                <ArrowUpRight size={13} />
              </a>
              <a
                href="https://www.youtube.com/watch?v=fyf0Hrl_8BI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-200 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                A To Z 3D Product Ads in Blender – The Easiest Method!
                <ArrowUpRight size={13} />
              </a>
              <a
                href="https://www.instagram.com/ahad_animates"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-200 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Follow on Instagram
                <ArrowUpRight size={13} />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
