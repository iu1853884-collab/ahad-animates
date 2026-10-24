"use client";

import { useState, useEffect } from "react";
import { CinematicIntro } from "@/components/intro/CinematicIntro";
import { Navbar } from "@/components/navigation/Navbar";
import { HeroSection } from "@/components/hero/HeroSection";
import { ServicesSection } from "@/components/services/ServicesSection";
import { StudioHighlights } from "@/components/about/StudioHighlights";
import { PortfolioSection } from "@/components/portfolio/PortfolioSection";
import { DailyWorkFeed } from "@/components/daily-work/DailyWorkFeed";
import { AboutSection } from "@/components/about/AboutSection";
import { ContactSection } from "@/components/contact/ContactSection";
import { Footer } from "@/components/footer/Footer";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

export default function Home() {
  const [showIntro, setShowIntro] = useState<boolean>(false);

  useEffect(() => {
    // Schedule check asynchronously to prevent cascading renders
    const rafId = requestAnimationFrame(() => {
      try {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        const hasSeenIntro = sessionStorage.getItem("ahad_animates_intro_seen");

        if (!hasSeenIntro && !prefersReducedMotion) {
          setShowIntro(true);
        }
      } catch {
        // Fallback for restricted browsing modes
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem("ahad_animates_intro_seen", "true");
    } catch {
      // Ignore storage errors in restricted iframe/browser modes
    }
  };

  return (
    <main className="min-h-screen bg-[#08080b] text-white selection:bg-violet-500/30 selection:text-white">
      {/* Cinematic Intro Experience */}
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}

      {/* Background ambient decorative blurs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-[10%] top-[-5%] h-[520px] w-[520px] rounded-full bg-violet-700/10 blur-[150px]" />
        <div className="absolute right-[-10%] top-[20%] h-[580px] w-[580px] rounded-full bg-fuchsia-700/10 blur-[170px]" />
        <div className="absolute bottom-[10%] left-[25%] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      {/* Main Website Sections */}
      <Navbar />
      <AboutSection />
      <HeroSection />
      <ServicesSection />
      <StudioHighlights />
      <PortfolioSection />
      <DailyWorkFeed />
      <ContactSection />
      <Footer />
      <AssistantWidget />
    </main>
  );
}
