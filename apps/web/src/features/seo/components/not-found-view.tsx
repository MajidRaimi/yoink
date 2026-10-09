import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import type { Route } from "next";
import Link from "next/link";
import { docHref, routes } from "@/shared/lib/routes";
import { ButtonLink } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";
import { Icon } from "@/shared/ui/icon";

type Destination = {
  label: string;
  detail: string;
  href: Route;
};

const DESTINATIONS: readonly Destination[] = [
  { label: "Getting started", detail: "Install yoink and save your first login", href: docHref("getting-started") },
  { label: "Providers", detail: "Connect one API key to your coding tools", href: docHref("providers") },
  { label: "CLI reference", detail: "Every command, alias and flag", href: routes.reference },
  { label: "Download", detail: "The menu bar app and the CLI", href: routes.download },
];

const DestinationLink = ({ destination }: { destination: Destination }): React.JSX.Element => (
  <li>
    <Link
      href={destination.href}
      className="group flex items-center gap-4 rounded-sm px-1 py-4 transition-colors dur-1 hover:text-brand-text focus-visible:focus-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground group-hover:text-brand-text">{destination.label}</span>
        <span className="block text-sm text-muted">{destination.detail}</span>
      </span>
      <Icon
        icon={ArrowRightIcon}
        size={18}
        className="text-faint transition-transform dur-2 ease-out group-hover:translate-x-0.5 group-hover:text-brand-text"
      />
    </Link>
  </li>
);

export const NotFoundView = (): React.JSX.Element => (
  <Container className="grid gap-12 py-20 sm:py-28 lg:grid-cols-12 lg:gap-16">
    <div className="lg:col-span-7">
      <h1 className="display text-5xl">This page does not exist.</h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        The address may be mistyped, or the link may be out of date. The docs and the home page are a good place to
        start again.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={routes.docs} size="lg">
          Read the docs
        </ButtonLink>
        <ButtonLink href={routes.home} variant="secondary" size="lg">
          Back to home
        </ButtonLink>
      </div>
    </div>
    <nav aria-label="Popular pages" className="lg:col-span-5 lg:pt-10">
      <ul className="divide-y divide-hairline border-y border-hairline">
        {DESTINATIONS.map((destination) => (
          <DestinationLink key={destination.href} destination={destination} />
        ))}
      </ul>
    </nav>
  </Container>
);
