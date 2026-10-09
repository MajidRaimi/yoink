import { PrimaryCta } from "@/features/download/primary-cta";
import { FINAL_COPY } from "@/features/landing/copy";
import styles from "@/features/landing/sections/final-cta.module.css";
import { cn } from "@/shared/lib/cn";
import { Container } from "@/shared/ui/container";

export const FinalCta = (): React.JSX.Element => (
  <section aria-labelledby="final-title" className={cn(styles.band, "bg-brand text-on-brand")}>
    <div className={styles.scope}>
      <Container size="wide" className="flex flex-col items-start gap-8 py-20 md:flex-row md:items-end md:justify-between md:py-28">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 id="final-title" className="display text-5xl text-foreground">
            {FINAL_COPY.title}
          </h2>
          <p className="text-lg text-muted">{FINAL_COPY.body}</p>
        </div>
        <PrimaryCta />
      </Container>
    </div>
  </section>
);
