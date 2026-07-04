"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Github } from "lucide-react";
import { ThemeToggler } from "@/components/custom/theme-toggler";
import { navLinks } from "@/lib/navigation";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <nav className="w-full max-w-6xl rounded-2xl border border-hairline bg-surface backdrop-blur-xl transition-all duration-500">
        <div className="relative flex h-14 items-center justify-between px-3">
          <Link href="/" className="relative z-10 flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <Image src="/icon.svg" alt="Yoink" width={28} height={28} className="rounded-lg" />
            <span className="display text-[15px]">Yoink</span>
          </Link>

          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-1 md:flex">
            <div className="pointer-events-auto flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-1.5 font-mono text-[13px] text-faint transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/download"
                className="rounded-lg px-4 py-1.5 font-mono text-[13px] text-faint transition-colors hover:text-foreground"
              >
                Download
              </Link>
              <a
                href={site.repo}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-4 py-1.5 font-mono text-[13px] text-faint transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="relative z-10 hidden shrink-0 items-center gap-3 md:flex">
            <ThemeToggler />
            <Link
              href="/docs/getting-started"
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-[13px] font-medium text-on-brand transition-opacity hover:opacity-85"
            >
              Get started
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="relative flex size-9 items-center justify-center p-2 md:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            <span
              className={cn(
                "absolute block h-px w-5 bg-foreground transition-all duration-300",
                open ? "rotate-45" : "-translate-y-[5px]",
              )}
            />
            <span
              className={cn(
                "absolute block h-px w-5 bg-foreground transition-all duration-300",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "absolute block h-px w-5 bg-foreground transition-all duration-300",
                open ? "-rotate-45" : "translate-y-[5px]",
              )}
            />
          </button>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 md:hidden",
            open ? "max-h-80" : "max-h-0",
          )}
        >
          <div className="space-y-1 px-5 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 font-mono text-sm text-faint transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/download"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 font-mono text-sm text-faint transition-colors hover:text-foreground"
            >
              Download
            </Link>
            <a
              href={site.repo}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl px-4 py-3 font-mono text-sm text-faint transition-colors hover:text-foreground"
            >
              <Github className="size-4" />
              GitHub
            </a>
            <div className="flex items-center gap-3 pt-2">
              <ThemeToggler />
              <Link
                href="/docs/getting-started"
                onClick={() => setOpen(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-medium text-on-brand"
              >
                Get started
                <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};
