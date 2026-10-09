"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/cn";
import { useCopyToClipboard } from "@/shared/lib/use-copy-to-clipboard";
import { Icon } from "@/shared/ui/icon";

export type CodeCopyButtonProps = {
  text: string;
};

const statusText = { idle: "", copied: "Copied to clipboard", failed: "Copy failed" } as const;

export const CodeCopyButton = ({ text }: CodeCopyButtonProps): React.JSX.Element => {
  const { status, copy } = useCopyToClipboard();
  const copied = status === "copied";
  return (
    <>
      <button
        type="button"
        onClick={() => void copy(text)}
        aria-label="Copy code"
        className={cn(
          "absolute top-2 right-2 grid size-8 place-items-center rounded-sm border border-hairline bg-background text-muted transition-colors dur-1 hover:text-foreground focus-visible:focus-ring",
          copied && "text-success hover:text-success",
        )}
      >
        <Icon icon={copied ? CheckIcon : CopyIcon} size={15} weight={copied ? "bold" : "regular"} />
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {statusText[status]}
      </span>
    </>
  );
};
