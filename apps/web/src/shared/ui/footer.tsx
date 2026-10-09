import { desktopRelease, site } from "@/shared/brand/site";
import { docHref, routes } from "@/shared/lib/routes";
import { Container } from "@/shared/ui/container";
import type { Href } from "@/shared/ui/href";
import { TextLink } from "@/shared/ui/link";
import { Logo } from "@/shared/ui/logo";

type FooterColumn = {
  title: string;
  links: readonly { label: string; href: Href }[];
};

const columns: readonly FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Download", href: routes.download },
      { label: "Install the CLI", href: routes.install },
      { label: "Releases", href: site.releasesUrl },
    ],
  },
  {
    title: "Docs",
    links: [
      { label: "Getting started", href: docHref("getting-started") },
      { label: "Providers", href: docHref("providers") },
      { label: "Security", href: docHref("security") },
      { label: "CLI reference", href: routes.reference },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "GitHub", href: site.repo },
      { label: "npm", href: site.npmUrl },
      { label: "Issues", href: site.issuesUrl },
    ],
  },
];

export const Footer = (): React.JSX.Element => (
  <footer className="border-t border-hairline">
    <Container className="grid gap-10 py-12 sm:grid-cols-[1.4fr_repeat(3,1fr)]">
      <div className="flex flex-col items-start gap-3">
        <Logo />
        <p className="max-w-xs text-sm text-muted">{site.description}</p>
        <p className="font-mono text-xs text-faint">
          <span>CLI </span>
          <bdi>v{site.version}</bdi>
          <span> · Desktop </span>
          <bdi>v{desktopRelease.version}</bdi>
        </p>
      </div>
      {columns.map((column) => (
        <nav key={column.title} aria-label={column.title} className="flex flex-col gap-1">
          <h2 className="mb-2 font-mono text-xs tracking-caps text-faint uppercase">{column.title}</h2>
          {column.links.map((link) => (
            <TextLink key={link.label} href={link.href} tone="muted" className="w-fit py-1 text-sm">
              {link.label}
            </TextLink>
          ))}
        </nav>
      ))}
    </Container>
  </footer>
);
