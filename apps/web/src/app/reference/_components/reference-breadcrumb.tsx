import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { REFERENCE_TITLE } from "@/features/reference/components/reference-page";
import { routes } from "@/shared/lib/routes";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/link";

export const ReferenceBreadcrumb = (): React.JSX.Element => (
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
      <li>Reference</li>
      <li aria-hidden="true">
        <Icon icon={CaretRightIcon} size={12} className="text-faint" />
      </li>
      <li>
        <span aria-current="page" className="text-foreground">
          {REFERENCE_TITLE}
        </span>
      </li>
    </ol>
  </nav>
);
