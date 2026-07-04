import { FadeUp } from "@/components/custom/motion";
import { HarnessBeam } from "./harness-beam";

export const EnvOverride = () => (
  <section className="border-y border-hairline bg-surface">
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 lg:grid-cols-2 lg:gap-16">
      <FadeUp>
        <h2 className="display text-[clamp(1.8rem,4vw,2.75rem)]">One harness, any backend</h2>
        <p className="mt-5 max-w-[48ch] leading-relaxed text-muted">
          Yoink points Claude Code at any Anthropic-compatible endpoint, OpenRouter, Ollama, GLM,
          anything that answers{" "}
          <code className="font-mono text-[0.92em] text-brand-text">/v1/models</code>.
        </p>
        <p className="mt-4 max-w-[48ch] leading-relaxed text-muted">
          It writes only seven{" "}
          <code className="font-mono text-[0.92em] text-brand-text">ANTHROPIC_*</code> keys into
          settings.json. Everything else in the file stays intact.
        </p>
      </FadeUp>
      <FadeUp delay={0.15}>
        <HarnessBeam />
      </FadeUp>
    </div>
  </section>
);
