"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/cn";
import { useCopyToClipboard } from "@/shared/lib/use-copy-to-clipboard";
import { Icon } from "@/shared/ui/icon";

export type CopyCommandProps = {
  command: string;
  prompt?: string;
  className?: string;
};

const statusText = { idle: "", copied: "Copied to clipboard", failed: "Copy failed" } as const;

export const CopyCommand = ({ command, prompt = "$", className }: CopyCommandProps): React.JSX.Element => {
  const { status, copy } = useCopyToClipboard();
  const copied = status === "copied";

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-md border border-hairline-strong bg-surface py-1.5 pr-1.5 pl-4 font-mono text-sm",
        className,
      )}
    >
      <span aria-hidden="true" className="select-none text-brand-text">
        {prompt}
      </span>
      <code
        tabIndex={0}
        className="w-0 min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xs py-1.5 tracking-mono focus-visible:focus-ring"
      >
        {command}
      </code>
      <button
        type="button"
        onClick={() => void copy(command)}
        aria-label="Copy command"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-sm text-muted transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring",
          copied && "text-success",
        )}
      >
        <Icon icon={copied ? CheckIcon : CopyIcon} size={16} weight={copied ? "bold" : "regular"} />
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {statusText[status]}
      </span>
    </div>
  );
};
