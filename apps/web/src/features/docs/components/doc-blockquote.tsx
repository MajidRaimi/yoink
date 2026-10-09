import {
  InfoIcon,
  LightbulbIcon,
  WarningCircleIcon,
  WarningIcon,
  WarningOctagonIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@/shared/ui/icon";
import { CALLOUT_KINDS, type CalloutKind } from "../mdx/remark-callouts";

export type DocBlockquoteProps = ComponentPropsWithoutRef<"blockquote"> & {
  "data-callout"?: string;
};

type CalloutStyle = {
  label: string;
  icon: PhosphorIcon;
};

const CALLOUTS: Readonly<Record<CalloutKind, CalloutStyle>> = {
  note: { label: "Note", icon: InfoIcon },
  tip: { label: "Tip", icon: LightbulbIcon },
  important: { label: "Important", icon: WarningCircleIcon },
  warning: { label: "Warning", icon: WarningIcon },
  caution: { label: "Caution", icon: WarningOctagonIcon },
};

const isCalloutKind = (value: string | undefined): value is CalloutKind =>
  value !== undefined && (CALLOUT_KINDS as readonly string[]).includes(value);

export const DocBlockquote = ({ "data-callout": kind, children, ...props }: DocBlockquoteProps): React.JSX.Element => {
  if (!isCalloutKind(kind)) return <blockquote {...props}>{children}</blockquote>;
  const callout = CALLOUTS[kind];
  return (
    <div role="note" aria-label={callout.label} className="doc-callout">
      <p className="doc-callout-label text-foreground">
        <Icon icon={callout.icon} size={16} weight="bold" />
        <span>{callout.label}</span>
      </p>
      <div className="doc-callout-body">{children}</div>
    </div>
  );
};
