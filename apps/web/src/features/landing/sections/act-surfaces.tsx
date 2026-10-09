import { DemoSlot } from "@/features/demos/demo-slot";
import { DocLinks } from "@/features/landing/components/doc-links";
import { SURFACES_COPY } from "@/features/landing/copy";
import { SectionHeader } from "@/features/landing/components/section-header";
import { SurfaceSwitcher } from "@/features/landing/surfaces/surface-switcher";
import { Container } from "@/shared/ui/container";

export const ActSurfaces = (): React.JSX.Element => (
  <section aria-labelledby="surfaces-title" className="py-24 md:py-32">
    <Container size="prose" className="flex flex-col gap-10">
      <SurfaceSwitcher
        header={<SectionHeader id="surfaces-title" title={SURFACES_COPY.title} body={SURFACES_COPY.body} />}
        terminal={<DemoSlot id="menu" linked />}
        menubar={<DemoSlot id="menubar-panel" linked />}
      />
      <DocLinks links={SURFACES_COPY.links} />
    </Container>
  </section>
);
