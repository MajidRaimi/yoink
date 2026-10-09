import { PencilSimpleIcon } from "@phosphor-icons/react/ssr";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/link";
import { repoEditUrl } from "../links";

export type DocEditLinkProps = {
  repoPath: string;
};

export const DocEditLink = ({ repoPath }: DocEditLinkProps): React.JSX.Element => (
  <TextLink href={repoEditUrl(repoPath)} tone="muted" className="inline-flex items-center gap-1.5 text-sm">
    <Icon icon={PencilSimpleIcon} size={14} />
    Edit this page on GitHub
  </TextLink>
);
