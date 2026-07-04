"use client";

import { Download, ShieldCheck } from "lucide-react";
import { CodeBlock } from "@/components/custom/code-block";
import { SectionLabel } from "@/components/custom/section-label";
import { Stagger, StaggerItem } from "@/components/custom/motion";
import { useDesktopDownload, type DesktopArch } from "@/lib/use-desktop-download";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const archOptions: { value: DesktopArch; label: string }[] = [
  { value: "aarch64", label: "Apple Silicon" },
  { value: "x64", label: "Intel" },
];

export const DesktopDownloadButtons = ({ className }: { className?: string }) => {
  const { arch, setArch, urlForArch, releasesUrl } = useDesktopDownload();

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={urlForArch(arch)}
          className="group flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-on-brand transition-opacity hover:opacity-85"
        >
          <Download
            className="size-4 transition-transform group-hover:translate-y-0.5"
            strokeWidth={2.5}
          />
          Download for Mac
        </a>
        <a
          href={releasesUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full border border-hairline-strong bg-surface-2 px-6 py-2.5 font-mono text-sm transition-colors hover:border-brand"
        >
          All releases
        </a>
      </div>
      <div className="flex items-center gap-1 rounded-full border border-hairline bg-surface-2 p-1">
        {archOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setArch(option.value)}
            aria-pressed={arch === option.value}
            className={cn(
              "rounded-full px-3 py-1 font-mono text-[12px] transition-colors",
              arch === option.value
                ? "bg-brand text-on-brand"
                : "border border-transparent text-faint hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const DesktopDownload = () => (
  <section className="mx-auto max-w-6xl px-4 py-24">
    <div className="relative w-full overflow-hidden rounded-2xl border border-hairline-strong bg-surface">
      <div className="glow absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/70"
        aria-hidden
      />
      <Stagger className="relative flex flex-col items-center gap-5 px-6 py-12 text-center sm:py-14">
        <StaggerItem className="w-full max-w-[220px]">
          <SectionLabel>Desktop app</SectionLabel>
        </StaggerItem>
        <StaggerItem>
          <h2 className="display text-[clamp(2rem,5vw,3.15rem)]">
            Yoink, right in your menu bar<span className="text-brand-text">.</span>
          </h2>
        </StaggerItem>
        <StaggerItem className="max-w-[46ch]">
          <p className="leading-relaxed text-muted">
            The same account switching, one click from the menu bar. A tiny native app that
            snapshots your Claude Code logins and swaps them without touching the terminal.
          </p>
        </StaggerItem>
        <StaggerItem>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-muted">
            <ShieldCheck className="size-3 text-brand-text" strokeWidth={2.5} />
            Notarized by Apple
          </span>
        </StaggerItem>
        <StaggerItem>
          <DesktopDownloadButtons />
        </StaggerItem>
        <StaggerItem>
          <p className="font-mono text-[13px] text-faint">
            macOS 12+ <span aria-hidden>·</span> Apple Silicon &amp; Intel{" "}
            <span aria-hidden>·</span> <bdi>v{site.desktopVersion}</bdi>
          </p>
        </StaggerItem>
        <StaggerItem className="w-full max-w-lg text-left">
          <CodeBlock code={site.installCommand} prompt />
        </StaggerItem>
      </Stagger>
    </div>
  </section>
);
