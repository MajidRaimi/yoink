import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/custom/code-block";
import { Stagger, StaggerItem } from "@/components/custom/motion";
import { CtaBackdrop } from "./cta-backdrop";
import { site } from "@/lib/site";

export const FinalCta = () => (
  <section className="mx-auto max-w-6xl px-4 py-24">
    <div className="relative w-full overflow-hidden rounded-2xl border border-hairline-strong bg-surface">
      <CtaBackdrop />
      <div className="glow absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/70" aria-hidden />
      <Stagger className="relative flex flex-col items-center gap-5 px-6 py-12 text-center sm:py-14">
        <StaggerItem>
          <h2 className="display text-[clamp(2rem,5vw,3.15rem)]">
            Stop re-logging in<span className="text-brand-text">.</span>
          </h2>
        </StaggerItem>
        <StaggerItem className="max-w-[42ch]">
          <p className="leading-relaxed text-muted">
            Register each account once. After that, a switch is a single keystroke, or the profile
            name as the only argument.
          </p>
        </StaggerItem>
        <StaggerItem className="w-full max-w-lg text-left">
          <CodeBlock code={site.installCommand} prompt />
        </StaggerItem>
        <StaggerItem className="flex flex-wrap justify-center gap-3">
          <Link
            href="/docs/getting-started"
            className="group flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-on-brand transition-opacity hover:opacity-85"
          >
            Read the docs
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.5}
            />
          </Link>
          <a
            href={site.repo}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-hairline-strong bg-surface-2 px-6 py-2.5 font-mono text-sm transition-colors hover:border-brand"
          >
            Star on GitHub
          </a>
        </StaggerItem>
      </Stagger>
    </div>
  </section>
);
