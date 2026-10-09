import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import type { DocMeta } from "@/shared/contract";
import { routes } from "@/shared/lib/routes";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/link";

export type DocBreadcrumbProps = {
  doc: DocMeta;
};

export const DocBreadcrumb = ({ doc }: DocBreadcrumbProps): React.JSX.Element => (
  <nav aria-label="Breadcrumb">
    <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
      <li>
        <TextLink href={routes.docs} tone="muted">
          Docs
        </TextLink>
      </li>
      <li aria-hidden="true">
        <Icon icon={CaretRightIcon} size={12} className="text-faint" />
      </li>
      <li>{doc.section}</li>
      <li aria-hidden="true">
        <Icon icon={CaretRightIcon} size={12} className="text-faint" />
      </li>
      <li>
        <span aria-current="page" className="text-foreground">
          {doc.nav}
        </span>
      </li>
    </ol>
  </nav>
);
