"use client";

import { Download } from "lucide-react";
import { useDesktopDownload, type DesktopArch } from "@/lib/use-desktop-download";
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
