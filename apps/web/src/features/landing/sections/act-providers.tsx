import { DemoSlot } from "@/features/demos/demo-slot";
import { PROVIDERS_COPY } from "@/features/landing/copy";
import { SectionHeader } from "@/features/landing/components/section-header";
import { Container } from "@/shared/ui/container";

export const ActProviders = (): React.JSX.Element => (
  <section aria-labelledby="providers-title" className="border-t border-hairline bg-surface py-24 md:py-32">
    <Container size="wide" className="grid gap-12 lg:grid-cols-12 lg:gap-14">
      <DemoSlot id="provider-add" className="order-2 lg:order-1 lg:col-span-7" />
      <div className="order-1 flex flex-col gap-10 lg:order-2 lg:col-span-5 lg:pt-4">
        <SectionHeader id="providers-title" title={PROVIDERS_COPY.title} body={PROVIDERS_COPY.body} />
        <ol className="flex flex-col border-t border-hairline">
          {PROVIDERS_COPY.steps.map((step) => (
            <li key={step.title} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-hairline py-3.5 text-sm">
              <span className="font-mono tracking-mono text-foreground">{step.title}</span>
              <span className="text-muted">{step.detail}</span>
            </li>
          ))}
        </ol>
      </div>
    </Container>
  </section>
);
