"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Compass,
  Lightbulb,
  Megaphone,
  Package,
  ShoppingBag,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { servicesData } from "@/data/services";

const iconMap = {
  Compass,
  Lightbulb,
  Boxes,
  Package,
  Sparkles,
  Megaphone,
  ShoppingBag,
  WandSparkles,
};

export function ServicesSection() {
  return (
    <section
      id="services"
      className="relative mx-auto max-w-7xl px-6 py-24 md:px-12"
    >
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-bold tracking-[0.3em] text-violet-400 uppercase">
          WHAT WE CREATE
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Made to stand out
        </h2>
        <p className="mt-4 text-base leading-7 text-zinc-400">
          Creative 3D product visuals and animations crafted to capture attention,
          communicate value, and elevate brand perception.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {servicesData.map((service, idx) => {
          const Icon = iconMap[service.iconName];
          return (
            <motion.article
              key={service.number}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-white/[0.015] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-400/40 hover:from-violet-500/[0.08] hover:to-white/[0.02] hover:shadow-xl hover:shadow-violet-500/10 sm:p-7"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-violet-500/[0.06] blur-3xl transition group-hover:bg-violet-400/[0.14]"
              />
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-violet-400">
                    {service.number}
                  </span>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-zinc-400 transition group-hover:border-violet-400/40 group-hover:bg-violet-400/10 group-hover:text-violet-200">
                    <Icon size={18} />
                  </div>
                </div>
                <h3 className="mt-7 text-xl font-bold leading-7 text-white">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {service.description}
                </p>
              </div>

              <a
                href="#contact"
                className="aa-button aa-button-secondary mt-8 min-h-10 self-start rounded-full px-4 py-2 text-xs tracking-wider"
              >
                Discuss a project{" "}
                <ArrowRight
                  className="ml-1.5 transition-transform duration-300 group-hover:translate-x-1"
                  size={14}
                />
              </a>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
