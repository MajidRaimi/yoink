import type { ReactNode } from "react";
import { FadeUp, Stagger, StaggerItem } from "@/components/custom/motion";
import { ModelSearchPalette } from "./model-search-palette";
import { PersonaSwitchTerminal } from "./persona-switch-terminal";

type Persona = {
  tag: string;
  title: string;
  body: ReactNode;
  artifact: ReactNode;
  reversed?: boolean;
};

const personas: Persona[] = [
  {
    tag: "the rate-limited",
    title: "You hit the usage cap mid-session.",
    body: "So you keep a second subscription for exactly that moment. Yoink re-snapshots the live token before each switch (Claude Code refreshes it silently), turning a browser round-trip into a two-second command.",
    artifact: <PersonaSwitchTerminal />,
  },
  {
    tag: "the model operator",
    title: "You'd rather run GLM or a local model.",
    reversed: true,
    body: (
      <>
        Yoink registers any Anthropic-compatible endpoint as a profile: it validates the key against{" "}
        <code className="font-mono text-[0.92em] text-brand-text">/v1/models</code>, hands you a
        searchable catalog, and manages the env overrides Claude Code reads.
      </>
    ),
    artifact: <ModelSearchPalette />,
  },
];

export const Personas = () => (
  <section className="mx-auto max-w-6xl px-5 py-24">
    <FadeUp>
      <h2 className="display max-w-2xl text-[clamp(1.8rem,4vw,2.75rem)]">
        Built for two kinds of heavy user
      </h2>
      <p className="mt-4 max-w-[56ch] leading-relaxed text-muted">
        One keeps hitting Claude&apos;s usage cap. The other wants different models behind the same
        harness.
      </p>
    </FadeUp>
    <Stagger className="mt-12 divide-y divide-hairline" stagger={0.14}>
      {personas.map((persona) => (
        <StaggerItem
          key={persona.tag}
          className="grid items-center gap-8 py-14 first:pt-0 last:pb-0 lg:grid-cols-2 lg:gap-16"
        >
          <div className={persona.reversed ? "lg:order-2" : undefined}>
            <p className="font-mono text-[13px] text-brand-text">{persona.tag}</p>
            <h3 className="display mt-3 text-2xl sm:text-[1.75rem]">{persona.title}</h3>
            <p className="mt-4 max-w-[48ch] leading-relaxed text-muted">{persona.body}</p>
          </div>
          <div className={persona.reversed ? "lg:order-1" : undefined}>{persona.artifact}</div>
        </StaggerItem>
      ))}
    </Stagger>
  </section>
);
