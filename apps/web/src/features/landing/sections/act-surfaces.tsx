import { DemoSlot } from "@/features/demos/demo-slot";
import { SURFACES_COPY } from "@/features/landing/copy";
import { SectionHeader } from "@/features/landing/components/section-header";
import { SurfaceSwitcher } from "@/features/landing/surfaces/surface-switcher";
import { TerminalCommands } from "@/features/landing/surfaces/terminal-commands";
import { Container } from "@/shared/ui/container";

export const ActSurfaces = (): React.JSX.Element => (
  <section aria-labelledby="surfaces-title" className="py-24 md:py-32">
    <Container size="wide">
      <SurfaceSwitcher
        header={<SectionHeader id="surfaces-title" title={SURFACES_COPY.title} body={SURFACES_COPY.body} />}
        terminal={<TerminalCommands />}
        menubar={<DemoSlot id="menubar-panel" />}
      />
    </Container>
  </section>
);
