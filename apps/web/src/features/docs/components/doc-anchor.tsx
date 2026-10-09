import type { Route } from "next";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

export type DocAnchorProps = ComponentPropsWithoutRef<"a">;

const isInternalPath = (href: string | undefined): href is string => href !== undefined && href.startsWith("/");

export const DocAnchor = ({ href, children, ...props }: DocAnchorProps): React.JSX.Element => {
  if (isInternalPath(href)) {
    return (
      <Link href={href as Route} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};
