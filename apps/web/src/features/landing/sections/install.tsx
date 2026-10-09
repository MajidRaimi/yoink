import { InstallTabs } from "@/features/download/install-tabs";
import { INSTALL_COPY } from "@/features/landing/copy";
import { SectionHeader } from "@/features/landing/components/section-header";
import { Container } from "@/shared/ui/container";

export const Install = (): React.JSX.Element => (
  <section id="install" aria-labelledby="install-title" className="border-t border-hairline bg-surface py-24 md:py-28">
    <Container size="prose" className="flex flex-col gap-10">
      <SectionHeader id="install-title" title={INSTALL_COPY.title} body={INSTALL_COPY.body} />
      <InstallTabs />
    </Container>
  </section>
);
