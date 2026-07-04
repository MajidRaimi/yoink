import { Fragment } from "react";
import { ArrowRight } from "lucide-react";
import { FadeUp, Stagger, StaggerItem } from "@/components/custom/motion";

const steps = [
  {
    n: "1",
    op: "read",
    title: "Re-snapshot the live login",
    surface: "credential store",
    body: "Claude Code refreshes tokens in the background. Yoink folds the live one back in first, so nothing is lost.",
    command: 'Keychain on macOS · ~/.claude/.credentials.json elsewhere',
  },
  {
    n: "2",
    op: "write",
    title: "Write the target credentials",
    surface: "~/.claude.json",
    body: "The target blob returns to the credential store (Keychain on macOS, credentials file on Linux and Windows), its oauthAccount identity to ~/.claude.json. Atomic writes, owner-only.",
    command: "~/.claude.json → oauthAccount",
  },
  {
    n: "3",
    op: "write",
    title: "Reconcile the env block",
    surface: "~/.claude/settings.json",
    body: "A Claude account clears the seven ANTHROPIC_* overrides; an external provider writes them. Nothing else changes.",
    command: "~/.claude/settings.json → env",
  },
];

export const HowItWorks = () => (
  <section className="border-y border-hairline bg-surface">
    <div className="mx-auto max-w-6xl px-5 py-24">
      <FadeUp>
        <h2 className="display max-w-2xl text-[clamp(1.8rem,4vw,2.75rem)]">Three moves per switch</h2>
        <p className="mt-4 max-w-[58ch] leading-relaxed text-muted">
          The same three ordered writes every time, against the files Claude Code already manages.
          Nothing hidden.
        </p>
      </FadeUp>
      <Stagger as="ol" className="mt-14 flex flex-col gap-6 md:flex-row md:items-stretch md:gap-4">
        {steps.map((step, index) => (
          <Fragment key={step.n}>
            <StaggerItem as="li" className="flex flex-1 flex-col border-t border-hairline-strong pt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-full border border-hairline-strong bg-background font-mono text-[13px] text-brand-text">
                  {step.n}
                </span>
                <span className="rounded-full border border-hairline px-2.5 py-0.5 font-mono text-[11px] text-faint">
                  {step.surface}
                </span>
              </div>
              <h3 className="display mt-5 text-lg">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
              <div className="mt-auto flex items-baseline gap-2.5 rounded-lg border border-hairline bg-background px-3.5 py-2.5 font-mono text-[13px]">
                <span
                  className={`shrink-0 ${step.op === "write" ? "text-brand-text" : "text-faint"}`}
                >
                  {step.op}
                </span>
                <span className="shrink-0 text-hairline-strong">·</span>
                <span className="text-muted [word-break:break-word]">
                  <bdi>{step.command}</bdi>
                </span>
              </div>
            </StaggerItem>
            {index < steps.length - 1 && (
              <StaggerItem as="li" className="flex shrink-0 justify-center md:mt-8" aria-hidden>
                <ArrowRight
                  className="size-5 rotate-90 text-faint md:rotate-0"
                  strokeWidth={1.5}
                />
              </StaggerItem>
            )}
          </Fragment>
        ))}
      </Stagger>
    </div>
  </section>
);
