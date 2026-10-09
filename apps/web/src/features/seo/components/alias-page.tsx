import type { Metadata } from "next";
import { canonicalPath, docAliasTarget, type DocAlias } from "@/shared/lib/routes";
import { Container } from "@/shared/ui/container";
import { TextLink } from "@/shared/ui/link";
import { canonicalUrl, pageMetadata } from "../metadata";

export type AliasPageProps = {
  alias: DocAlias;
};

const MOVED_TITLE = "This page moved";

export const aliasMetadata = (alias: DocAlias): Metadata => {
  const target = canonicalPath(docAliasTarget(alias));
  const metadata = pageMetadata({
    title: MOVED_TITLE,
    description: `This page now lives at ${target}.`,
    path: target,
    noIndex: true,
  });
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images: [`${canonicalUrl(target)}opengraph-image.png`] },
    twitter: { ...metadata.twitter, images: [`${canonicalUrl(target)}opengraph-image.png`] },
  };
};

export const AliasPage = ({ alias }: AliasPageProps): React.JSX.Element => {
  const href = docAliasTarget(alias);
  const target = canonicalPath(href);
  return (
    <Container size="prose" className="py-24 sm:py-32">
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <h1 className="display text-4xl">{MOVED_TITLE}</h1>
      <p className="mt-4 text-lg text-muted">
        <span>Continue to </span>
        <TextLink href={href}>
          <bdi>{target}</bdi>
        </TextLink>
      </p>
    </Container>
  );
};
