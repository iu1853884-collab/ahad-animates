import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DailyWorkFeed } from "@/components/daily-work/DailyWorkFeed";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

export default function DailyWorkArchivePage() {
  return (
    <main className="min-h-screen bg-[#08080b] text-white">
      <header className="border-b border-white/[0.08] bg-[#08080b]/85 px-6 py-4 backdrop-blur-xl md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/#daily-work"
            className="aa-button aa-button-secondary min-h-10 rounded-full px-4 py-2 text-xs uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Studio
          </Link>
          <Link
            href="/"
            className="text-xs font-bold tracking-tight text-zinc-300"
          >
            AHAD<span className="text-violet-400">.</span>ANIMATES
          </Link>
        </div>
      </header>
      <DailyWorkFeed archive />
      <AssistantWidget />
    </main>
  );
}
