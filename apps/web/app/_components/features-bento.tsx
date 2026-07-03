import type { ReactNode } from "react";
import { HoverCard } from "@/components/custom/hover-card";
import { FadeUp, Stagger, StaggerItem } from "@/components/custom/motion";
import {
  AtomicWriteVisual,
  CompiledBinaryVisual,
  KeyboardMenuVisual,
  SecretGuardVisual,
} from "./feature-visuals";

type FeatureCardProps = {
  span: string;
  visual: ReactNode;
  title: string;
  body: ReactNode;
};

const FeatureCard = ({ span, visual, title, body }: FeatureCardProps) => (
  <StaggerItem className={span}>
    <HoverCard className="group overflow-hidden">
      {visual}
      <div className="border-t border-hairline p-6">
        <h3 className="display text-lg">{title}</h3>
        <p className="mt-2 max-w-[46ch] leading-relaxed text-muted">{body}</p>
      </div>
    </HoverCard>
  </StaggerItem>
);

export const FeaturesBento = () => (
  <section className="mx-auto max-w-6xl px-5 py-24">
    <FadeUp>
      <h2 className="display max-w-2xl text-[clamp(1.8rem,4vw,2.75rem)]">
        Small tool, sharp edges filed down
      </h2>
    </FadeUp>
    <Stagger className="mt-12 grid gap-4 lg:grid-cols-6">
      <FeatureCard
        span="lg:col-span-4"
        visual={<KeyboardMenuVisual />}
        title="A menu you drive by keyboard"
        body={
          <>
            Bare <code className="font-mono text-[0.92em] text-brand-text">yoink</code> lists every
            profile. One key per action, and every action loops back to the list.
          </>
        }
      />
      <FeatureCard
        span="lg:col-span-2"
        visual={<CompiledBinaryVisual />}
        title="One compiled binary"
        body={
          <>
            <code className="font-mono text-[0.92em] text-brand-text">bun build --compile</code>{" "}
            bakes the CLI, deps, and runtime into one file.
          </>
        }
      />
      <FeatureCard
        span="lg:col-span-3"
        visual={<SecretGuardVisual />}
        title="It won't leak a token into git"
        body="It offers a .gitignore entry before writing a key, and warns when settings.json is tracked."
      />
      <FeatureCard
        span="lg:col-span-3"
        visual={<AtomicWriteVisual />}
        title="Every write is atomic"
        body="Temp file, then rename. You never get a half-written store, and secrets stay at chmod 600."
      />
    </Stagger>
  </section>
);
