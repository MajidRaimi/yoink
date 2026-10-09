import { GithubLogoIcon } from "@phosphor-icons/react/ssr";
import { Fragment } from "react";
import { fetchProofStats } from "@/features/landing/proof/fetch-stats";
import { clauseSeparator, proofClauses } from "@/features/landing/proof/stats";
import { site } from "@/shared/brand/site";
import { ButtonLink } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";
import { Icon } from "@/shared/ui/icon";

export const Proof = async (): Promise<React.JSX.Element> => {
  const clauses = proofClauses(await fetchProofStats());

  return (
    <section aria-labelledby="proof-title" className="border-y border-hairline py-20 md:py-28">
      <Container size="prose" className="flex flex-col items-start gap-8">
        <h2 id="proof-title" className="sr-only">
          Project status
        </h2>
        <p className="text-2xl leading-snug tracking-tight text-muted md:text-3xl">
          <span className="text-foreground">Built in the open under the MIT license</span>
          {clauses.length === 0 ? "." : ": "}
          {clauses.map((clause, index) => (
            <Fragment key={clause.key}>
              {clause.before}
              <bdi className="font-mono font-medium tracking-mono text-foreground">{clause.value}</bdi>
              {clause.after}
              {clauseSeparator(index, clauses.length)}
            </Fragment>
          ))}
        </p>
        <ButtonLink href={site.repo} variant="secondary">
          <Icon icon={GithubLogoIcon} size={18} />
          Star on GitHub
        </ButtonLink>
      </Container>
    </section>
  );
};
