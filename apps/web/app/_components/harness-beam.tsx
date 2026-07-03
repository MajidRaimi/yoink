"use client";

import { forwardRef, useRef, type ReactNode } from "react";
import { User } from "lucide-react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { ClaudeCodeGlyph } from "@/components/custom/claude-code-glyph";
import { cn } from "@/lib/utils";

const providers = [
  { slug: "anthropic", name: "Anthropic" },
  { slug: "openrouter", name: "OpenRouter" },
  { slug: "ollama", name: "Ollama" },
  { slug: "zai", name: "z.ai" },
  { slug: "deepseek", name: "DeepSeek" },
  { slug: "moonshot", name: "Moonshot" },
];

const Node = forwardRef<HTMLDivElement, { className?: string; children: ReactNode }>(
  ({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border border-hairline-strong bg-background shadow-lg shadow-black/20 dark:shadow-black/50",
        className,
      )}
    >
      {children}
    </div>
  ),
);
Node.displayName = "Node";

const BEAM = {
  gradientStartColor: "#facc15",
  gradientStopColor: "#fde047",
  pathColor: "#9ca3af",
  pathOpacity: 0.18,
  pathWidth: 1.5,
} as const;

export const HarnessBeam = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const yoinkRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const p0 = useRef<HTMLDivElement>(null);
  const p1 = useRef<HTMLDivElement>(null);
  const p2 = useRef<HTMLDivElement>(null);
  const p3 = useRef<HTMLDivElement>(null);
  const p4 = useRef<HTMLDivElement>(null);
  const p5 = useRef<HTMLDivElement>(null);
  const providerRefs = [p0, p1, p2, p3, p4, p5];

  return (
    <div
      ref={containerRef}
      className="relative flex h-[420px] w-full items-center justify-center overflow-hidden"
    >
      <div className="flex size-full max-w-md items-stretch justify-between gap-4 px-2">
        <div className="flex flex-col justify-center">
          <Node ref={yoinkRef} className="size-14 border-transparent bg-brand text-on-brand">
            <User className="size-6" strokeWidth={2.25} />
          </Node>
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex flex-col items-center gap-3">
            <Node ref={hubRef} className="size-16 border-brand/40">
              <ClaudeCodeGlyph className="size-7 text-brand-text" />
            </Node>
            <span className="font-mono text-[11px] text-faint">Claude Code</span>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3">
          {providers.map((provider, index) => (
            <Node key={provider.slug} ref={providerRefs[index]}>
              <span
                className="brand-logo size-5 text-foreground/80"
                style={{
                  maskImage: `url(/logos/${provider.slug}.svg)`,
                  WebkitMaskImage: `url(/logos/${provider.slug}.svg)`,
                }}
              />
            </Node>
          ))}
        </div>
      </div>

      {providerRefs.map((ref, index) => (
        <AnimatedBeam
          key={index}
          containerRef={containerRef}
          fromRef={ref}
          toRef={hubRef}
          duration={3}
          delay={index * 0.35}
          {...BEAM}
        />
      ))}
      <AnimatedBeam containerRef={containerRef} fromRef={hubRef} toRef={yoinkRef} duration={3} {...BEAM} />
    </div>
  );
};
