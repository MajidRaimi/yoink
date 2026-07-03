"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { docsSections } from "@/lib/navigation";

export const DocsBreadcrumb = () => {
  const pathname = usePathname();
  const current = pathname.replace(/\/$/, "");
  const section = docsSections.find((entry) => entry.items.some((item) => item.href === current));
  const doc = section?.items.find((item) => item.href === current);

  if (!section || !doc) return null;

  const Icon = doc.icon;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex items-center gap-2 font-mono text-xs text-faint"
    >
      <Link
        href="/docs"
        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        <BookOpen className="size-3.5" strokeWidth={2} />
        docs
      </Link>
      <ChevronRight className="size-3.5 text-hairline-strong" />
      <span className="lowercase">{section.name}</span>
      <ChevronRight className="size-3.5 text-hairline-strong" />
      <span className="flex items-center gap-1.5 text-brand-text">
        <Icon className="size-3.5" strokeWidth={2} />
        {doc.title}
      </span>
    </nav>
  );
};
