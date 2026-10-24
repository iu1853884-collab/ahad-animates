import type { ReactNode } from "react";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { Footer } from "@/components/footer/Footer";
import { Navbar } from "@/components/navigation/Navbar";

export function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08080b] text-white selection:bg-violet-500/30 selection:text-white">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-[10%] top-[-5%] h-[520px] w-[520px] rounded-full bg-violet-700/10 blur-[150px]" />
        <div className="absolute right-[-10%] top-[20%] h-[580px] w-[580px] rounded-full bg-fuchsia-700/10 blur-[170px]" />
      </div>
      <Navbar />
      <div className="relative z-10">{children}</div>
      <Footer />
      <AssistantWidget />
    </div>
  );
}
