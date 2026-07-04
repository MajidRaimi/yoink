import Link from "next/link";
import { navLinks } from "@/lib/navigation";
import { site } from "@/lib/site";

export const Footer = () => (
  <footer className="border-t border-hairline">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 font-mono text-[13px] text-faint sm:flex-row">
      <span>
        <span className="text-brand-text">Yoink</span> · switch Claude Code accounts, fast
      </span>
      <div className="flex items-center gap-6">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
            {link.label}
          </Link>
        ))}
        <a href={site.repo} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
          GitHub
        </a>
      </div>
    </div>
  </footer>
);
