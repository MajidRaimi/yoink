import { site } from "@/shared/brand/site";
import { formatDisplayDate } from "@/features/seo/last-modified";
import { TextLink } from "@/shared/ui/link";
import type { EntryMeta } from "../entry-types";

export type LastCheckedProps = {
  meta: EntryMeta;
};

export const LastChecked = ({ meta }: LastCheckedProps): React.JSX.Element | null => {
  const checked = meta.competitor?.checked ?? meta.checked;
  if (checked === undefined) return null;
  return (
    <p className="text-sm text-muted">
      <span>Last checked </span>
      <bdi>
        <time dateTime={checked}>{formatDisplayDate(`${checked}T00:00:00.000Z`)}</time>
      </bdi>
      {meta.competitor === undefined ? null : (
        <>
          <span> against </span>
          <TextLink href={meta.competitor.url as `https://${string}`} tone="muted">
            {meta.competitor.name} <bdi>{meta.competitor.version}</bdi>
          </TextLink>
        </>
      )}
      <span>. Spotted something out of date? </span>
      <TextLink href={site.issuesUrl} tone="muted">
        Open an issue
      </TextLink>
      <span>.</span>
    </p>
  );
};
