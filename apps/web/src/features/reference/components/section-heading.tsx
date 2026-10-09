import type { ReactNode } from "react";

export type SectionHeadingProps = {
  id: string;
  title: string;
  children?: ReactNode;
};

export const SectionHeading = ({ id, title, children }: SectionHeadingProps): React.JSX.Element => (
  <div className="mb-6">
    <h2 id={id} className="display scroll-mt-24 text-2xl sm:text-3xl">
      <a href={`#${id}`} className="rounded-xs transition-colors dur-1 hover:text-brand-text focus-visible:focus-ring">
        {title}
      </a>
    </h2>
    {children === undefined ? null : <p className="mt-2 max-w-2xl text-muted">{children}</p>}
  </div>
);
