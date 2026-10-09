import { ArrowClockwiseIcon } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import type { DemoRootProps } from "@/features/demos/engine/use-demo";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";
import { Kbd } from "@/shared/ui/kbd";

export type DemoHint = {
  keys: readonly string[];
  action: string;
};

export type DemoFrameProps = {
  label: string;
  title: string;
  status: string;
  hints?: readonly DemoHint[];
  toolbar?: ReactNode;
  onReplay?: () => void;
  rootProps?: DemoRootProps;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export const DemoFrame = ({
  label,
  title,
  status,
  hints = [],
  toolbar,
  onReplay,
  rootProps,
  className,
  bodyClassName,
  children,
}: DemoFrameProps): React.JSX.Element => (
  <div
    role="group"
    aria-label={label}
    aria-roledescription="interactive demo"
    tabIndex={rootProps === undefined ? undefined : 0}
    {...rootProps}
    className={cn(
      "flex min-w-0 flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface font-mono text-sm shadow-2 focus-visible:focus-ring",
      className,
    )}
  >
    <div className="flex h-10 shrink-0 items-center gap-3 border-b border-hairline px-3">
      <span className="truncate text-xs text-faint">{title}</span>
      <div className="ml-auto flex items-center gap-2">
        {toolbar}
        {onReplay === undefined ? null : (
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-xs text-muted transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring"
          >
            <Icon icon={ArrowClockwiseIcon} size={14} />
            Replay
          </button>
        )}
      </div>
    </div>
    <div className={cn("min-h-0 flex-1 p-4", bodyClassName)}>{children}</div>
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline px-4 py-2.5">
      <p role="status" aria-live="polite" aria-atomic="true" className="min-w-0 flex-1 truncate text-xs text-muted">
        {status}
      </p>
      {hints.length === 0 ? null : (
        <ul aria-label="Keyboard shortcuts" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
          {hints.map((hint) => (
            <li key={hint.action} className="flex items-center gap-1">
              {hint.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
              <span className="ml-0.5">{hint.action}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
