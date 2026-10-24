"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, LockKeyhole, Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08080b]/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
        <Link
          href="/"
          className="group flex items-center text-xl font-black tracking-tight transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080b] rounded-lg p-1"
          aria-label="Ahad Animates Homepage"
        >
          <span>AHAD</span>
          <span className="text-violet-400 transition-transform group-hover:scale-125 inline-block">
            .
          </span>
          <span className="ml-2 text-xs font-semibold tracking-[0.28em] text-zinc-500 transition-colors group-hover:text-zinc-300">
            ANIMATES
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          className="hidden items-center gap-4 text-xs font-medium text-zinc-400 lg:flex"
          aria-label="Main navigation"
        >
          <Link
            href="/portfolio"
            className="transition hover:text-white focus-visible:outline-none focus-visible:text-violet-300"
          >
            Portfolio
          </Link>
          <Link
            href="/daily-work"
            className="transition hover:text-white focus-visible:outline-none focus-visible:text-violet-300"
          >
            Daily Work
          </Link>
          <Link
            href="/services"
            className="transition hover:text-white focus-visible:outline-none focus-visible:text-violet-300"
          >
            Services
          </Link>
          <Link
            href="/about"
            className="transition hover:text-white focus-visible:outline-none focus-visible:text-violet-300"
          >
            About
          </Link>
          <Link
            href="/tutorials"
            className="transition hover:text-white focus-visible:outline-none focus-visible:text-violet-300"
          >
            Tutorials
          </Link>
          <Link
            href="/ads"
            className="transition hover:text-white focus-visible:outline-none focus-visible:text-violet-300"
          >
            Ads &amp; Videos
          </Link>
          <Link
            href="/blog"
            className="transition hover:text-white focus-visible:outline-none focus-visible:text-violet-300"
          >
            Blog
          </Link>
          <Link
            href="/contact"
            className="transition hover:text-white focus-visible:outline-none focus-visible:text-violet-300"
          >
            Contact
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/15 px-3.5 py-2 text-[10px] font-semibold tracking-wider text-zinc-400 transition hover:border-violet-400/45 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <LockKeyhole size={12} aria-hidden="true" />
            Admin
          </Link>
          <Link
            href="/contact"
            className="aa-button aa-button-primary rounded-full px-5 py-2.5 text-xs tracking-wider"
          >
            Let&apos;s Talk <ArrowRight size={14} className="text-violet-400" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 md:hidden"
          aria-label={
            mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-b border-white/10 bg-[#0c0c12] px-6 py-5 md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 text-sm font-medium">
              <Link
                href="/portfolio"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 transition hover:text-violet-300 py-1"
              >
                Portfolio
              </Link>
              <Link
                href="/daily-work"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 transition hover:text-violet-300 py-1"
              >
                Daily Work
              </Link>
              <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 transition hover:text-violet-300 py-1"
              >
                Services
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 transition hover:text-violet-300 py-1"
              >
                About
              </Link>
              <Link
                href="/tutorials"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 transition hover:text-violet-300 py-1"
              >
                Tutorials
              </Link>
              <Link
                href="/ads"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 transition hover:text-violet-300 py-1"
              >
                Ads &amp; Videos
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 transition hover:text-violet-300 py-1"
              >
                Blog
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 transition hover:text-violet-300 py-1"
              >
                Contact
              </Link>
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-2 border-t border-white/10 pt-4 text-zinc-400 transition hover:text-violet-300"
              >
                <LockKeyhole size={14} aria-hidden="true" />
                Admin Login
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-xs font-semibold tracking-wider text-white shadow-lg shadow-violet-600/30"
              >
                Let&apos;s Talk <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
