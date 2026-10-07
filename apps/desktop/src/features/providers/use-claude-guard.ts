import { useState } from "react";
import { ipc } from "@/shared/ipc";
import type { HarnessStatus } from "@/shared/types";

type ClaudeGuard = {
  pending: HarnessStatus | null;
  request: (status: HarnessStatus) => void;
  confirm: () => void;
  cancel: () => void;
};

export const useClaudeGuard = (apply: (status: HarnessStatus) => void): ClaudeGuard => {
  const [pending, setPending] = useState<HarnessStatus | null>(null);

  const request = (status: HarnessStatus): void => {
    if (status.id !== "claude-code" || status.connected) {
      apply(status);
      return;
    }
    void ipc
      .isClaudeRunning()
      .catch(() => false)
      .then((running) => (running ? setPending(status) : apply(status)));
  };

  const confirm = (): void => {
    if (pending !== null) apply(pending);
    setPending(null);
  };

  return { pending, request, confirm, cancel: () => setPending(null) };
};
