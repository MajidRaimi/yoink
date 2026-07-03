"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { docsFlat, type DocLink } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type PagerCardProps = {
  doc: DocLink;
  direction: "prev" | "next";
};

const PagerCard = ({ doc, direction }: PagerCardProps) => {
  const reduce = useReducedMotion();
  const isNext = direction === "next";
  const Arrow = isNext ? ArrowRight : ArrowLeft;

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Link
        href={doc.href}
        className={cn(
          "group relative flex h-full items-center gap-4 overflow-hidden rounded-xl border border-hairline bg-surface p-5 transition-colors hover:border-brand/40",
          isNext && "flex-row-reverse text-right",
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-8 size-24 rounded-full bg-brand/[0.07] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          style={isNext ? { right: "-1rem" } : { left: "-1rem" }}
        />
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline-strong bg-background text-faint transition-colors group-hover:border-brand group-hover:text-brand-text">
          <Arrow
            className={cn(
              "size-4 transition-transform motion-reduce:transition-none",
              isNext ? "group-hover:translate-x-0.5" : "group-hover:-translate-x-0.5",
            )}
            strokeWidth={2}
          />
        </span>
        <span className="relative min-w-0">
          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            {isNext ? "Next" : "Previous"}
          </span>
          <span className="mt-1 block truncate font-medium transition-colors group-hover:text-brand-text">
            {doc.title}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-muted">{doc.description}</span>
        </span>
      </Link>
    </motion.div>
  );
};

export const DocsPager = () => {
  const pathname = usePathname();
  const current = pathname.replace(/\/$/, "");
  const index = docsFlat.findIndex((doc) => doc.href === current);
  if (index === -1) return null;

  const previous = index > 0 ? docsFlat[index - 1] : undefined;
  const next = index < docsFlat.length - 1 ? docsFlat[index + 1] : undefined;

  return (
    <div className="mt-16 grid grid-cols-1 gap-4 border-t border-hairline pt-8 sm:grid-cols-2">
      {previous ? <PagerCard doc={previous} direction="prev" /> : <span className="hidden sm:block" />}
      {next ? <PagerCard doc={next} direction="next" /> : <span className="hidden sm:block" />}
    </div>
  );
};
