import type { Metadata, Route } from "next";
import { canonicalPath, COLLECTION_ALIAS_TARGETS, docAliasTarget, type CollectionAlias, type DocAlias } from "@/shared/lib/routes";
import { Container } from "@/shared/ui/container";
import { TextLink } from "@/shared/ui/link";
import { canonicalUrl, pageMetadata } from "../metadata";

export type AliasPageProps = {
  alias: DocAlias;
};

export type RedirectPageProps = {
  target: Route;
};

const MOVED_TITLE = "This page moved";

const targetPath = (target: Route): string => {
  const [path = "", hash] = target.split("#");
  return hash === undefined ? canonicalPath(target) : `${canonicalPath(path as Route)}#${hash}`;
};

export const redirectMetadata = (target: Route): Metadata => {
  const canonical = canonicalPath(target);
  const metadata = pageMetadata({
    title: MOVED_TITLE,
    description: `This page now lives at ${targetPath(target)}.`,
    path: canonical,
    noIndex: true,
  });
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images: [`${canonicalUrl(canonical)}opengraph-image.png`] },
    twitter: { ...metadata.twitter, images: [`${canonicalUrl(canonical)}opengraph-image.png`] },
  };
};

export const RedirectPage = ({ target }: RedirectPageProps): React.JSX.Element => {
  const destination = targetPath(target);
  return (
    <Container size="prose" className="py-24 sm:py-32">
      <meta httpEquiv="refresh" content={`0; url=${destination}`} />
      <h1 className="display text-4xl">{MOVED_TITLE}</h1>
      <p className="mt-4 text-lg text-muted">
        <span>Continue to </span>
        <TextLink href={target}>
          <bdi>{destination}</bdi>
        </TextLink>
      </p>
    </Container>
  );
};

export const aliasMetadata = (alias: DocAlias): Metadata => redirectMetadata(docAliasTarget(alias));

export const AliasPage = ({ alias }: AliasPageProps): React.JSX.Element => <RedirectPage target={docAliasTarget(alias)} />;

export const collectionAliasMetadata = (alias: CollectionAlias): Metadata => redirectMetadata(COLLECTION_ALIAS_TARGETS[alias]);

export type CollectionAliasPageProps = {
  alias: CollectionAlias;
};

export const CollectionAliasPage = ({ alias }: CollectionAliasPageProps): React.JSX.Element => (
  <RedirectPage target={COLLECTION_ALIAS_TARGETS[alias]} />
);
