"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "failed";

export const COPY_STATUS_TEXT: Readonly<Record<CopyStatus, string>> = {
  idle: "",
  copied: "Copied to clipboard",
  failed: "Copy failed",
};

export type CopyToClipboard = {
  status: CopyStatus;
  copy: (text: string) => Promise<void>;
};

const RESET_AFTER_MS = 1800;

export const useCopyToClipboard = (): CopyToClipboard => {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback((): void => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const copy = useCallback(
    async (text: string): Promise<void> => {
      clearTimer();
      try {
        await navigator.clipboard.writeText(text);
        setStatus("copied");
      } catch {
        setStatus("failed");
      }
      timer.current = setTimeout(() => setStatus("idle"), RESET_AFTER_MS);
    },
    [clearTimer],
  );

  return { status, copy };
};
