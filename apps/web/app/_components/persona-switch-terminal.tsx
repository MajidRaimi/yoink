import { TerminalWindow } from "@/components/custom/terminal-window";

export const PersonaSwitchTerminal = () => (
  <TerminalWindow title="~ · zsh">
    <div className="space-y-1">
      <p>
        <span className="text-brand-text">$ </span>claude
      </p>
      <p className="text-faint">
        <span className="text-brand-text">⚠</span> usage limit reached, resets in 2h 14m
      </p>
      <p className="pt-1">
        <span className="text-brand-text">$ </span>yoink work
      </p>
      <p className="text-foreground/70">
        <span className="text-green-600 dark:text-green-400">✔</span> switched to work{" "}
        <span className="text-faint">
          (<bdi>work@company.com</bdi>)
        </span>
      </p>
      <p className="pt-1">
        <span className="text-brand-text">$ </span>claude
      </p>
      <p className="text-faint">fresh window. back to it.</p>
    </div>
  </TerminalWindow>
);
