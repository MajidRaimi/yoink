"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useRef } from "react";
import { cx } from "@/shared/lib/cx";
import { COPY_STATUS_TEXT, useCopyToClipboard } from "@/shared/lib/use-copy-to-clipboard";
import { Icon } from "@/shared/ui/icon";
import { useOverflowsEnd } from "@/shared/ui/use-overflows-end";

export type CopyCommandProps = {
  command: string;
  prompt?: string;
  className?: string;
};

export const CopyCommand = ({ command, prompt = "$", className }: CopyCommandProps): React.JSX.Element => {
  const { status, copy } = useCopyToClipboard();
  const copied = status === "copied";
  const codeRef = useRef<HTMLElement>(null);
  const endSentinelRef = useRef<HTMLSpanElement>(null);
  const overflowsEnd = useOverflowsEnd(codeRef, endSentinelRef);

  return (
    <div
      className={cx(
        "flex min-w-0 items-center gap-3 rounded-md border border-hairline-strong bg-surface py-1.5 pr-1.5 pl-4 font-mono text-sm",
        className,
      )}
    >
      <span aria-hidden="true" className="select-none text-brand-text">
        {prompt}
      </span>
      <code
        ref={codeRef}
        tabIndex={0}
        dir="ltr"
        className={cx(
          "w-0 min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xs py-1.5 tracking-mono focus-visible:focus-ring",
          overflowsEnd && "[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]",
        )}
      >
        {command}
        <span ref={endSentinelRef} aria-hidden="true" className="inline-block h-px w-px align-middle" />
      </code>
      <button
        type="button"
        onClick={() => void copy(command)}
        aria-label="Copy command"
        className={cx(
          "grid size-9 shrink-0 place-items-center rounded-sm transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring",
          copied ? "text-success" : "text-muted",
        )}
      >
        <Icon icon={copied ? CheckIcon : CopyIcon} size={16} weight={copied ? "bold" : "regular"} />
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {COPY_STATUS_TEXT[status]}
      </span>
    </div>
  );
};
