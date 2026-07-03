"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

type Heading = { id: string; text: string };

const ACTIVE_OFFSET = 130;

export const DocsToc = () => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-toc-heading]"));
    if (nodes.length === 0) return;

    setHeadings(nodes.map((node) => ({ id: node.id, text: node.dataset.tocText ?? "" })));

    let frame = 0;

    const update = () => {
      frame = 0;
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      if (scrolledToBottom) {
        setActiveId(nodes[nodes.length - 1]!.id);
        return;
      }

      let current = nodes[0]!.id;
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= ACTIVE_OFFSET) current = node.id;
        else break;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page">
      <p className="mb-3 flex items-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[0.28em] text-faint">
        <List className="size-3.5" strokeWidth={2} />
        On this page
      </p>
      <ul className="flex flex-col gap-0.5">
        {headings.map((heading) => {
          const active = heading.id === activeId;

          return (
            <li key={heading.id} className="relative">
              {active && (
                <motion.span
                  layoutId="docs-toc-active"
                  aria-hidden
                  className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-brand"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }}
                />
              )}
              <a
                href={`#${heading.id}`}
                className={cn(
                  "block rounded-md py-1.5 pr-2 pl-4 text-[13px] leading-snug transition-colors",
                  active ? "text-brand-text" : "text-faint hover:text-foreground",
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
