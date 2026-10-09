import type { ReactNode } from "react";
import { routes } from "@/shared/lib/routes";
import { ButtonLink } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";
import { Logo } from "@/shared/ui/logo";
import { NavLinkItem } from "@/shared/ui/nav-link-item";
import { NAV_LINKS } from "@/shared/ui/nav-links";
import { NavbarMenu } from "@/shared/ui/navbar-menu";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

export type NavbarProps = {
  cta?: ReactNode;
};

export const DefaultNavbarCta = (): React.JSX.Element => (
  <ButtonLink href={routes.install} size="sm">
    Install the CLI
  </ButtonLink>
);

export const Navbar = ({ cta = <DefaultNavbarCta /> }: NavbarProps): React.JSX.Element => (
  <header className="sticky top-0 z-40 border-b border-hairline bg-background">
    <a
      href="#main"
      className="sr-only rounded-sm bg-brand px-3 py-2 text-sm font-medium text-on-brand focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50"
    >
      Skip to content
    </a>
    <Container className="relative flex h-16 items-center gap-6">
      <Logo />
      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map((link) => (
          <NavLinkItem key={link.label} link={link} />
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <div className="hidden sm:flex">{cta}</div>
        <NavbarMenu cta={cta} />
      </div>
    </Container>
  </header>
);
