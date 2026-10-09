import { DemoSlot } from "@/features/demos/demo-slot";
import { PrimaryCta } from "@/features/download/primary-cta";
import { HERO_COPY } from "@/features/landing/copy";
import { Container } from "@/shared/ui/container";

export const Hero = (): React.JSX.Element => (
  <section aria-labelledby="hero-title" className="pt-16 pb-20 md:pt-24 md:pb-28">
    <Container size="wide" className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
      <div className="flex flex-col items-start gap-6 lg:col-span-5">
        <h1 id="hero-title" className="display text-5xl">
          {HERO_COPY.headline}
        </h1>
        <p className="max-w-md text-lg text-muted">{HERO_COPY.subhead}</p>
        <PrimaryCta className="mt-2" />
      </div>
      <DemoSlot id="menu" eager className="lg:col-span-7" />
    </Container>
  </section>
);
