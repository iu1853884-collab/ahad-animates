import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { StudioHighlights } from "@/components/about/StudioHighlights";
import { AboutSection } from "@/components/about/AboutSection";

export default function AboutPage() {
  return (
    <PublicPageShell>
      <StudioHighlights />
      <AboutSection animateProfile />
    </PublicPageShell>
  );
}
