"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Clock3,
  HeartHandshake,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

const strengths = [
  {
    title: "Lifelike detail",
    description: "Careful materials, lighting, and product-focused finish.",
    icon: Sparkles,
  },
  {
    title: "Dynamic storytelling",
    description: "Visual narratives that give products a clear point of view.",
    icon: Target,
  },
  {
    title: "Timely delivery",
    description: "A considered process built around agreed project timelines.",
    icon: Clock3,
  },
  {
    title: "Budget-conscious solutions",
    description: "Visual options shaped to fit the scope of each brief.",
    icon: Wallet,
  },
  {
    title: "Quality assurance",
    description: "Review the details and presentation before delivery.",
    icon: BadgeCheck,
  },
  {
    title: "A growing creative community",
    description: "Learning and sharing to encourage creative growth.",
    icon: HeartHandshake,
  },
];

const clientTypes = [
  "Luxury and perfume brands",
  "E-commerce businesses",
  "Product companies",
  "Advertising agencies",
  "Digital marketing agencies",
  "Corporate clients",
];

export function StudioHighlights() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-20 md:px-12">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-violet-400">
          PAKISTAN&apos;S PREMIER 3D ANIMATION STUDIO
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Why Ahad Animates
        </h2>
        <p className="mt-4 text-base leading-7 text-zinc-400">
          A quality-focused creative partner for brands that need thoughtful
          3D visualization, animation, or CGI storytelling.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {strengths.map(({ title, description, icon: Icon }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition-colors hover:border-violet-400/30"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/[0.07] text-violet-200">
              <Icon aria-hidden="true" size={18} />
            </div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {description}
            </p>
          </motion.article>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-violet-500/[0.07] to-transparent p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-zinc-200">
          Who we work with
        </h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {clientTypes.map((clientType) => (
            <li
              key={clientType}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300"
            >
              {clientType}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
