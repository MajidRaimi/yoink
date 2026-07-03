import "@xterm/xterm/css/xterm.css";
import { useState } from "react";
import { useViewStore } from "@/shared/view-store";
import { usePty } from "./use-pty";

const useLoginSession = () => {
  const [exitCode, setExitCode] = useState<number | null>(null);
  const containerRef = usePty({ onExit: setExitCode });
  return { containerRef, exitCode };
};

const StatusChip = ({ exitCode }: { exitCode: number | null }) => {
  if (exitCode === null) {
    return (
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
        <span className="size-1.5 rounded-full bg-brand" />
        running
      </span>
    );
  }
  if (exitCode === 0) {
    return <span className="font-mono text-[11px] text-brand-text">done</span>;
  }
  return <span className="font-mono text-[11px] text-[#f87171]">failed</span>;
};

export const LoginTerminal = () => {
  const setView = useViewStore((state) => state.setView);
  const { containerRef, exitCode } = useLoginSession();
  const finished = exitCode !== null;

  return (
    <div className="rise flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Back to profiles"
          onClick={() => setView("list")}
          className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-mono text-[13px] text-foreground">Add Claude account</h1>
        <div className="ml-auto">
          <StatusChip exitCode={exitCode} />
        </div>
      </div>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 rounded-lg border border-hairline bg-glass p-2"
      />
      {finished ? (
        <div className="flex shrink-0 justify-end">
          <button
            type="button"
            onClick={() => setView("list")}
            className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-medium text-on-brand transition-opacity hover:opacity-85"
          >
            Back to profiles
          </button>
        </div>
      ) : (
        <p className="shrink-0 text-[11px] text-faint">
          This runs yoink add. Complete the sign-in in your browser when it opens.
        </p>
      )}
    </div>
  );
};
