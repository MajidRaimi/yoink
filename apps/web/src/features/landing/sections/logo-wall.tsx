import { LogoMarquee } from "@/features/landing/logo-wall/logo-marquee";
import { LOGO_WALL } from "@/shared/brand/logos";
import { Container } from "@/shared/ui/container";

const WALL_LABEL = "Tools and providers yoink works with";

export const LogoWall = (): React.JSX.Element => (
  <section aria-labelledby="logo-wall-title" className="border-y border-hairline py-8">
    <h2 id="logo-wall-title" className="sr-only">
      {WALL_LABEL}
    </h2>
    <Container size="wide">
      <LogoMarquee logos={LOGO_WALL} label="logo scroll" />
    </Container>
  </section>
);
