import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { site } from "@/lib/site";
import { LogoMarquee } from "@/components/custom/logo-marquee";
import { ClaudeCodeGlyph } from "@/components/custom/claude-code-glyph";
import { ParticleWaves } from "./particle-waves";

const providers = [
  { slug: "anthropic", name: "Anthropic" },
  { slug: "openrouter", name: "OpenRouter" },
  { slug: "ollama", name: "Ollama" },
  { slug: "zai", name: "z.ai" },
  { slug: "deepseek", name: "DeepSeek" },
  { slug: "moonshot", name: "Moonshot" },
] as const;

export const Hero = () => (
  <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44">
    <div className="glow absolute inset-0" aria-hidden />
    <ParticleWaves />
    <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 text-center">
      <Link
        href="/docs/how-it-works"
        className="rise group inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-surface py-1 pl-1 pr-3 backdrop-blur-sm transition-colors hover:border-brand"
        style={{ animationDelay: "0ms" }}
      >
        <span className="rounded-full bg-brand px-2.5 py-0.5 font-mono text-[11px] font-semibold text-on-brand">
          v{site.version}
        </span>
        <ClaudeCodeGlyph className="size-4 text-foreground" />
        <span className="font-mono text-[13px] text-muted">built for Claude Code</span>
        <ChevronRight className="size-3.5 text-faint transition-transform group-hover:translate-x-0.5" />
      </Link>
      <h1
        className="display rise mt-7 text-[clamp(2.5rem,6vw,4rem)]"
        style={{ animationDelay: "80ms" }}
      >
        Swap Claude Code accounts <br className="hidden sm:inline" />
        in <span className="text-brand-text">one keystroke</span>.
      </h1>
      <p
        className="rise mt-6 max-w-[44ch] text-lg leading-relaxed text-pretty text-muted"
        style={{ animationDelay: "160ms" }}
      >
        Snapshot each login as a named profile, then switch in place. No browser, no re-login.
      </p>
      <div
        className="rise mt-8 flex flex-wrap justify-center gap-3"
        style={{ animationDelay: "240ms" }}
      >
        <Link
          href="/docs/getting-started"
          className="group flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-on-brand transition-opacity hover:opacity-85"
        >
          Get started
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2.5}
          />
        </Link>
        <a
          href={site.repo}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full border border-hairline-strong bg-surface-2 px-6 py-2.5 font-mono text-sm text-foreground backdrop-blur-sm transition-colors hover:border-brand"
        >
          View source
        </a>
      </div>
      <p
        className="rise mt-7 font-mono text-[13px] text-faint"
        style={{ animationDelay: "300ms" }}
      >
        macOS <span className="text-hairline-strong">·</span> Keychain-native{" "}
        <span className="text-hairline-strong">·</span> single binary
      </p>
      <div
        className="rise mt-[15rem] w-full max-w-4xl sm:mt-[18rem]"
        style={{ animationDelay: "420ms" }}
      >
        <p className="mb-6 font-mono text-[13px] text-faint">
          drive the Claude Code harness with any of these
        </p>
        <LogoMarquee providers={providers} />
      </div>
    </div>
  </section>
);
