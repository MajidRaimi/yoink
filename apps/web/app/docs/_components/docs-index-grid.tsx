"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { docsSections } from "@/lib/navigation";
import { SectionLabel } from "@/components/custom/section-label";

export const DocsIndexGrid = () => {
  const reduce = useReducedMotion();

  return (
    <div className="mt-12 space-y-10">
      {docsSections.map((section) => (
        <section key={section.name}>
          <SectionLabel className="mb-4">/// {section.name.toLowerCase()}</SectionLabel>
          <ul className="grid gap-3 sm:grid-cols-2">
            {section.items.map((doc, index) => {
              const Icon = doc.icon;

              return (
                <motion.li
                  key={doc.href}
                  whileHover={reduce ? undefined : { y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Link
                    href={doc.href}
                    style={{ animationDelay: `${index * 60}ms` }}
                    className="rise group relative flex h-full gap-4 overflow-hidden rounded-xl border border-hairline bg-surface p-5 transition-colors hover:border-brand/40"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-hairline bg-background text-brand-text transition-colors group-hover:border-brand/50">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-medium transition-colors group-hover:text-brand-text">
                        {doc.title}
                        <ArrowRight
                          className="size-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                          strokeWidth={2}
                        />
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted">
                        {doc.description}
                      </span>
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
