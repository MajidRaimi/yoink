import Link from "next/link";
import { ArrowRight, PanelTop, ShieldCheck, SquareTerminal } from "lucide-react";
import { CodeBlock } from "@/components/custom/code-block";
import { Stagger, StaggerItem } from "@/components/custom/motion";
import { DesktopDownloadButtons } from "./desktop-download";
import { CtaBackdrop } from "./cta-backdrop";
import { site } from "@/lib/site";

const Panel = ({
  icon,
  label,
  headline,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  headline: string;
  children: React.ReactNode;
}) => (
  <div className="group relative flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface-2 p-6 transition-colors duration-300 hover:border-brand/40">
    <div
      className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-brand/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
      aria-hidden
    />
    <div className="relative flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg border border-hairline-strong bg-surface text-faint transition-colors duration-300 group-hover:border-brand/50 group-hover:text-brand-text">
        {icon}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint transition-colors duration-300 group-hover:text-foreground">
        {label}
      </span>
    </div>
    <p className="relative mt-3 text-[15px] leading-relaxed text-foreground">{headline}</p>
    <div className="relative mt-5 flex flex-col gap-4">{children}</div>
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      aria-hidden
    />
  </div>
);

export const FinalCta = () => (
  <section className="mx-auto max-w-6xl px-4 py-24">
    <div className="relative w-full overflow-hidden rounded-2xl border border-hairline-strong bg-surface">
      <CtaBackdrop />
      <div className="glow absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/70"
        aria-hidden
      />
      <Stagger className="relative flex flex-col items-center gap-5 px-6 py-14 text-center sm:py-16">
        <StaggerItem>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-faint">
            Get Yoink
          </span>
        </StaggerItem>
        <StaggerItem>
          <h2 className="display text-[clamp(2rem,5vw,3.15rem)]">
            Stop re-logging in<span className="text-brand-text">.</span>
          </h2>
        </StaggerItem>
        <StaggerItem className="max-w-[52ch]">
          <p className="leading-relaxed text-muted">
            Register each account once, then switch from your menu bar or your terminal. Same
            profiles, same keystroke, two ways in.
          </p>
        </StaggerItem>
        <StaggerItem className="w-full pt-2">
          <div className="grid w-full items-start gap-4 text-left md:grid-cols-2">
            <Panel
              icon={<PanelTop className="size-4" strokeWidth={2} />}
              label="Menu bar app"
              headline="One click from the macOS menu bar. No terminal, no re-login."
            >
              <DesktopDownloadButtons className="items-start" />
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-faint">
                <ShieldCheck className="size-3 text-brand-text" strokeWidth={2.5} />
                Notarized by Apple <span aria-hidden>·</span> macOS 12+ <span aria-hidden>·</span>{" "}
                <bdi>v{site.desktopVersion}</bdi>
              </p>
            </Panel>
            <Panel
              icon={<SquareTerminal className="size-4" strokeWidth={2} />}
              label="Command line"
              headline="One line in your shell. macOS, Linux, and Windows."
            >
              <CodeBlock code={site.installCommand} prompt />
              <Link
                href="/download"
                className="group/link inline-flex items-center gap-1 font-mono text-[11px] text-faint transition-colors hover:text-brand-text"
              >
                Windows, npm, and more
                <ArrowRight
                  className="size-3 transition-transform group-hover/link:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Link>
            </Panel>
          </div>
        </StaggerItem>
        <StaggerItem className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 font-mono text-[13px] text-muted">
          <Link
            href="/docs/getting-started"
            className="group/docs inline-flex items-center gap-1 transition-colors hover:text-brand-text"
          >
            Read the docs
            <ArrowRight
              className="size-3.5 transition-transform group-hover/docs:translate-x-0.5"
              strokeWidth={2.5}
            />
          </Link>
          <a
            href={site.repo}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-brand-text"
          >
            Star on GitHub
          </a>
        </StaggerItem>
      </Stagger>
    </div>
  </section>
);
