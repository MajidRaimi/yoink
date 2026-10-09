import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import type { Route } from "next";
import { Fragment } from "react";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/link";

export type BreadcrumbLink = {
  label: string;
  href?: Route;
};

export type DocBreadcrumbProps = {
  items: readonly BreadcrumbLink[];
};

const Separator = (): React.JSX.Element => (
  <li aria-hidden="true">
    <Icon icon={CaretRightIcon} size={12} className="text-faint" />
  </li>
);

export const DocBreadcrumb = ({ items }: DocBreadcrumbProps): React.JSX.Element => (
  <nav aria-label="Breadcrumb">
    <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <Separator /> : null}
            <li>
              {last ? (
                <span aria-current="page" className="text-foreground">
                  {item.label}
                </span>
              ) : item.href === undefined ? (
                item.label
              ) : (
                <TextLink href={item.href} tone="muted">
                  {item.label}
                </TextLink>
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  </nav>
);
