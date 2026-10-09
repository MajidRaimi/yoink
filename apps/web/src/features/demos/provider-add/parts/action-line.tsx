import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Icon } from "@/shared/ui/icon";
import { Line } from "@/features/demos/provider-add/parts/line";

export type ActionLineProps = {
  icon: PhosphorIcon;
  label: string;
  onActivate?: () => void;
};

export const ActionLine = ({ icon, label, onActivate }: ActionLineProps): React.JSX.Element => {
  const content = (
    <>
      <Icon icon={icon} size={12} className="text-brand-text" />
      <span>{label}</span>
    </>
  );
  return (
    <Line>
      {onActivate === undefined ? (
        <span className="inline-flex items-center gap-2 text-muted">{content}</span>
      ) : (
        <button
          type="button"
          onClick={onActivate}
          className="inline-flex h-6 items-center gap-2 rounded-xs px-1 text-foreground hover:bg-surface-2 focus-visible:focus-ring"
        >
          {content}
        </button>
      )}
    </Line>
  );
};
