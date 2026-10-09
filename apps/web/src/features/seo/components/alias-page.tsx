import type { Metadata } from "next";
import { canonicalPath, docAliasTarget, type DocAlias } from "@/shared/lib/routes";
import { Container } from "@/shared/ui/container";
import { TextLink } from "@/shared/ui/link";
import { canonicalUrl } from "../metadata";

export type AliasPageProps = {
  alias: DocAlias;
};

export const aliasMetadata = (alias: DocAlias): Metadata => ({
  title: "This page moved",
  alternates: { canonical: canonicalUrl(canonicalPath(docAliasTarget(alias))) },
  robots: { index: false, follow: true },
});

export const AliasPage = ({ alias }: AliasPageProps): React.JSX.Element => {
  const href = docAliasTarget(alias);
  const target = canonicalPath(href);
  return (
    <Container size="prose" className="py-24 sm:py-32">
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <h1 className="display text-4xl">This page moved</h1>
      <p className="mt-4 text-lg text-muted">
        <span>Continue to </span>
        <TextLink href={href}>
          <bdi>{target}</bdi>
        </TextLink>
      </p>
    </Container>
  );
};
