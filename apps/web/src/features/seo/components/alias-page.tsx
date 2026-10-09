import type { Metadata } from "next";
import { canonicalPath, docAliasTarget, type DocAlias } from "@/shared/lib/routes";
import { Container } from "@/shared/ui/container";
import { TextLink } from "@/shared/ui/link";

export type AliasPageProps = {
  alias: DocAlias;
};

export const aliasMetadata = (alias: DocAlias): Metadata => ({
  alternates: { canonical: canonicalPath(docAliasTarget(alias)) },
  robots: { index: false, follow: true },
});

export const AliasPage = ({ alias }: AliasPageProps): React.JSX.Element => {
  const href = docAliasTarget(alias);
  const target = canonicalPath(href);
  return (
    <Container className="py-24">
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <h1 className="display text-4xl">This page moved</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        <span>Continue to </span>
        <TextLink href={href}>
          <bdi>{target}</bdi>
        </TextLink>
      </p>
    </Container>
  );
};
