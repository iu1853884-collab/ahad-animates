"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

interface CinematicIntroProps {
  onComplete: () => void;
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    // Smooth counter progression up to 100%
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Organic step increments
        const increment = Math.floor(Math.random() * 8) + 3;
        return Math.min(prev + increment, 100);
      });
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (progress === 100) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        const completeTimer = setTimeout(() => {
          onComplete();
        }, 700);
        return () => clearTimeout(completeTimer);
      }, 400);

      return () => clearTimeout(exitTimer);
    }
  }, [progress, onComplete]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="cinematic-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#08080b] px-6 py-12 text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Ahad Animates"
        >
          {/* Ambient decorative lighting */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[140px]" />
            <div className="absolute left-1/3 top-1/3 h-[250px] w-[250px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
          </div>

          {/* Top Header Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 rounded-full border border-violet-400/20 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold tracking-[0.25em] text-violet-300 uppercase"
          >
            <Sparkles size={12} className="text-violet-400" />
            <span>Digital Studio &bull; 3D Showcase</span>
          </motion.div>

          {/* Center Brand & Reveal Sequence */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-4"
            >
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl md:text-7xl">
                <span>AHAD</span>
                <span className="text-violet-400">.</span>
                <span className="ml-3 text-sm font-semibold tracking-[0.3em] text-zinc-400 block sm:inline">
                  ANIMATES
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="max-w-md text-xs sm:text-sm tracking-[0.15em] text-zinc-400 uppercase font-medium"
            >
              Products Reimagined Through 3D &amp; CGI
            </motion.p>

            {/* Counter and Progress Bar */}
            <div className="mt-12 w-64 sm:w-80">
              <div className="mb-3 flex items-center justify-between text-xs font-mono font-medium text-zinc-400">
                <span className="tracking-wider">INITIALIZING</span>
                <span className="text-violet-300 font-bold">{progress}%</span>
              </div>

              {/* Progress Track */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-400"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Controls / Skip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative z-10 flex items-center gap-4"
          >
            <button
              type="button"
              onClick={handleSkip}
              className="aa-button aa-button-secondary min-h-10 rounded-full px-5 py-2 text-xs uppercase tracking-wider"
            >
              <span>Skip Intro</span>
              <ArrowRight size={12} className="text-violet-400" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
