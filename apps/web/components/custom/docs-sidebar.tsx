"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { docsSections } from "@/lib/navigation";
import { SectionLabel } from "@/components/custom/section-label";
import { cn } from "@/lib/utils";

export const DocsSidebar = () => {
  const pathname = usePathname();
  const current = pathname.replace(/\/$/, "");
  const reduce = useReducedMotion();

  return (
    <nav className="flex flex-col gap-7">
      {docsSections.map((section) => (
        <div key={section.name}>
          <SectionLabel className="mb-3 px-2">/// {section.name.toLowerCase()}</SectionLabel>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = current === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "text-brand-text"
                        : "text-muted hover:bg-surface hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="docs-nav-active"
                        aria-hidden
                        className="absolute inset-0 rounded-lg border border-hairline-strong bg-surface-2"
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 520, damping: 42 }
                        }
                      >
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand" />
                      </motion.span>
                    )}
                    <Icon
                      className={cn(
                        "relative size-4 shrink-0 transition-colors",
                        active ? "text-brand-text" : "text-faint group-hover:text-foreground",
                      )}
                      strokeWidth={2}
                    />
                    <span className="relative truncate">{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};
