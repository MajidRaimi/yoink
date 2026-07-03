"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  prompt?: boolean;
  title?: string;
  className?: string;
};

export const CodeBlock = ({ code, prompt = false, title, className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lines = code.split("\n");

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-hairline bg-surface transition-colors hover:border-hairline-strong",
        className,
      )}
    >
      {title && (
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </span>
          <span className="ml-1 font-mono text-xs text-faint">{title}</span>
        </div>
      )}
      <div className="relative">
        <pre className="overflow-x-auto p-4 pr-14 font-mono text-[13px] leading-relaxed text-foreground">
          {lines.map((line, index) => (
            <span key={index} className="block">
              {prompt && line.length > 0 && !line.startsWith(" ") && (
                <span className="select-none text-brand-text">$ </span>
              )}
              {line}
            </span>
          ))}
        </pre>
        <div className="absolute top-2.5 right-2.5">
          <AnimatePresence>
            {copied && (
              <motion.span
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9 }}
                transition={{ duration: 0.16 }}
                className="pointer-events-none absolute -top-8 right-0 rounded-md border border-hairline bg-background px-2 py-1 font-mono text-[11px] text-brand-text shadow-sm"
              >
                Copied!
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy to clipboard"
            className="flex size-8 items-center justify-center rounded-lg border border-transparent text-faint transition-colors group-hover:text-muted hover:border-hairline hover:bg-surface-2 hover:text-foreground"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check className="size-4 text-brand-text" strokeWidth={2.5} />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Copy className="size-4" strokeWidth={2} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );
};
