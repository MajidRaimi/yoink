import type { LucideIcon } from "lucide-react";
import { Hash } from "lucide-react";
import { DocsArticle } from "@/components/custom/docs-article";
import { DocsBreadcrumb } from "@/components/custom/docs-breadcrumb";
import { DocsPager } from "@/components/custom/docs-pager";
import { JsonLd } from "@/components/custom/json-ld";
import { site } from "@/lib/site";
import { breadcrumbLd, techArticleLd } from "@/lib/structured-data";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type DocsPageProps = {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
};

const buildBreadcrumbs = (title: string, path: string) => {
  const crumbs = [{ name: "Home", url: `${site.url}/` }];
  if (path.startsWith("/docs/")) {
    crumbs.push({ name: "Docs", url: `${site.url}/docs/` });
  }
  crumbs.push({ name: title, url: `${site.url}${path}` });
  return crumbs;
};

export const DocsPage = ({ title, description, path, children }: DocsPageProps) => (
  <DocsArticle>
    <JsonLd data={techArticleLd({ title, description, url: `${site.url}${path}` })} />
    <JsonLd data={breadcrumbLd(buildBreadcrumbs(title, path))} />
    <DocsBreadcrumb />
    <h1 className="display text-3xl sm:text-4xl">{title}</h1>
    <p className="mt-3 text-lg leading-relaxed text-muted">{description}</p>
    <div className="mt-12 space-y-12">{children}</div>
    <DocsPager />
  </DocsArticle>
);

type DocsSectionProps = {
  heading: string;
  icon?: LucideIcon;
  children: React.ReactNode;
};

export const DocsSection = ({ heading, icon: Icon, children }: DocsSectionProps) => {
  const id = slugify(heading);

  return (
    <section className="border-t border-hairline pt-8 first:border-t-0 first:pt-0">
      <h2
        id={id}
        data-toc-heading
        data-toc-text={heading}
        className="group/heading flex scroll-mt-28 items-center gap-3"
      >
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-brand-text">
            <Icon className="size-4" strokeWidth={2} />
          </span>
        )}
        <span className="display text-xl">{heading}</span>
        <a
          href={`#${id}`}
          aria-label={`Link to ${heading}`}
          className="text-faint opacity-0 transition-opacity hover:text-brand-text group-hover/heading:opacity-100"
        >
          <Hash className="size-4" strokeWidth={2} />
        </a>
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-muted [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:text-brand-text [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
};
