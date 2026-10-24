import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { PortfolioSection } from "@/components/portfolio/PortfolioSection";

export default function PortfolioPage() {
  return (
    <PublicPageShell>
      <PortfolioSection fallbackToStatic={false} />
    </PublicPageShell>
  );
}
