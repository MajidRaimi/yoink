import { WarningIcon } from "@phosphor-icons/react";
import { TRACKED_SKIPPED, TRACKED_WARNING } from "@/features/landing/safety/settings-diff-model";
import { Icon } from "@/shared/ui/icon";

export const TrackedWarning = (): React.JSX.Element => (
  <div className="flex flex-col gap-3 border-t border-hairline px-4 py-4 font-mono text-[0.8125rem] leading-relaxed">
    <p className="flex gap-2.5">
      <Icon icon={WarningIcon} size={16} weight="fill" className="mt-0.5 text-brand-text" />
      <span>{TRACKED_WARNING}</span>
    </p>
    <p className="pl-6.5 text-muted">
      <span>Yes</span>
      <span aria-hidden="true"> / </span>
      <span className="font-medium text-foreground underline decoration-brand decoration-2 underline-offset-4">No</span>
      <span className="sr-only"> (selected by default)</span>
    </p>
    <p className="pl-6.5 text-muted">{TRACKED_SKIPPED}</p>
  </div>
);
