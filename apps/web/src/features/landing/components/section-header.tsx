import type { ReactNode } from "react";
import { Eyebrow } from "@/features/landing/components/eyebrow";
import { Reveal } from "@/features/landing/components/reveal";
import { cn } from "@/shared/lib/cn";

export type SectionHeaderProps = {
  id: string;
  title: string;
  body: ReactNode;
  eyebrow?: string;
  align?: "start" | "center";
  className?: string;
};

export const SectionHeader = ({
  id,
  title,
  body,
  eyebrow,
  align = "start",
  className,
}: SectionHeaderProps): React.JSX.Element => (
  <Reveal className={cn("flex max-w-2xl flex-col gap-4", align === "center" && "mx-auto items-center text-center", className)}>
    {eyebrow === undefined ? null : <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 id={id} className="display text-4xl">
      {title}
    </h2>
    <p className="max-w-xl text-lg text-muted">{body}</p>
  </Reveal>
);
