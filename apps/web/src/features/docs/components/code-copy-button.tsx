"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { cx } from "@/shared/lib/cx";
import { COPY_STATUS_TEXT, useCopyToClipboard } from "@/shared/lib/use-copy-to-clipboard";
import { Icon } from "@/shared/ui/icon";

export type CodeCopyButtonProps = {
  text: string;
};

export const CodeCopyButton = ({ text }: CodeCopyButtonProps): React.JSX.Element => {
  const { status, copy } = useCopyToClipboard();
  const copied = status === "copied";
  return (
    <>
      <button
        type="button"
        onClick={() => void copy(text)}
        aria-label="Copy code"
        className={cx(
          "absolute top-2 right-2 grid size-8 place-items-center rounded-sm border border-hairline bg-background transition-colors dur-1 focus-visible:focus-ring",
          copied ? "text-success" : "text-muted hover:text-foreground",
        )}
      >
        <Icon icon={copied ? CheckIcon : CopyIcon} size={15} weight={copied ? "bold" : "regular"} />
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {COPY_STATUS_TEXT[status]}
      </span>
    </>
  );
};
