import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";
import { CodeCopyButton } from "./code-copy-button";

export type DocPreProps = ComponentPropsWithoutRef<"pre"> & {
  "data-copy"?: string;
  "data-language"?: string;
};

export const DocPre = ({
  "data-copy": copyText,
  "data-language": language,
  className,
  children,
  ...props
}: DocPreProps): React.JSX.Element => (
  <div className="doc-code relative">
    <pre
      {...props}
      data-language={language}
      tabIndex={0}
      role="group"
      aria-label={language === undefined || language === "plaintext" ? "Code" : `${language} code`}
      className={cn("focus-visible:focus-ring", className)}
    >
      {children}
    </pre>
    {copyText === undefined || copyText.length === 0 ? null : <CodeCopyButton text={copyText} />}
  </div>
);
