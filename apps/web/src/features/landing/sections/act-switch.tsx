import { DemoSlot } from "@/features/demos/demo-slot";
import { DocLinks } from "@/features/landing/components/doc-links";
import { SWITCH_COPY } from "@/features/landing/copy";
import { SectionHeader } from "@/features/landing/components/section-header";
import { Container } from "@/shared/ui/container";

export const ActSwitch = (): React.JSX.Element => (
  <section aria-labelledby="switch-title" className="py-24 md:py-32">
    <Container size="prose" className="flex flex-col gap-12">
      <SectionHeader
        id="switch-title"
        eyebrow={SWITCH_COPY.eyebrow}
        title={SWITCH_COPY.title}
        body={SWITCH_COPY.body}
        align="center"
      />
      <DemoSlot id="subscription-switch" className="w-full" />
      <DocLinks links={SWITCH_COPY.links} className="items-center text-center" />
    </Container>
  </section>
);
