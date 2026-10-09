import { PencilSimpleIcon } from "@phosphor-icons/react/ssr";
import type { DocSlug } from "@/shared/lib/routes";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/link";
import { docEditUrl } from "../links";

export type DocEditLinkProps = {
  slug: DocSlug;
};

export const DocEditLink = ({ slug }: DocEditLinkProps): React.JSX.Element => (
  <TextLink href={docEditUrl(slug)} tone="muted" className="inline-flex items-center gap-1.5 text-sm">
    <Icon icon={PencilSimpleIcon} size={14} />
    Edit this page on GitHub
  </TextLink>
);
