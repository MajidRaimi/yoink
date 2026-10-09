import { ArrowClockwiseIcon } from "@phosphor-icons/react/ssr";
import { useId, type ReactNode } from "react";
import type { DemoRootProps } from "@/features/demos/engine/use-demo";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";
import { Kbd } from "@/shared/ui/kbd";

export type DemoHint = {
  keys: readonly string[];
  action: string;
};

export type DemoFocusTarget = "root" | "content";

export type DemoFrameProps = {
  label: string;
  title: string;
  status: string;
  hints?: readonly DemoHint[];
  toolbar?: ReactNode;
  onReplay?: () => void;
  rootProps?: DemoRootProps;
  focusTarget?: DemoFocusTarget;
  activeDescendant?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

type FrameHeaderProps = {
  title: string;
  toolbar?: ReactNode;
  onReplay?: () => void;
};

type FrameStatusProps = {
  status: string;
  announce: boolean;
};

type FrameHintsProps = {
  id: string;
  hints: readonly DemoHint[];
};

const FrameHeader = ({ title, toolbar, onReplay }: FrameHeaderProps): React.JSX.Element => (
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
);

const FrameStatus = ({ status, announce }: FrameStatusProps): React.JSX.Element => (
  <p role="status" aria-live={announce ? "polite" : "off"} aria-atomic="true" className="sr-only">
    {status}
  </p>
);

const FrameHints = ({ id, hints }: FrameHintsProps): React.JSX.Element => (
  <div className="shrink-0 border-t border-hairline px-4 py-3 max-sm:sr-only sm:flex sm:min-h-14 sm:items-center">
    {hints.length === 0 ? null : (
      <ul
        id={id}
        aria-label="Keyboard shortcuts"
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-faint"
      >
        {hints.map((hint) => (
          <li key={hint.action} className="flex items-center gap-1 whitespace-nowrap">
            {hint.keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
            <span className="ml-0.5">{hint.action}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const DemoFrame = ({
  label,
  title,
  status,
  hints = [],
  toolbar,
  onReplay,
  rootProps,
  focusTarget = "root",
  activeDescendant,
  className,
  bodyClassName,
  children,
}: DemoFrameProps): React.JSX.Element => {
  const hintsId = useId();
  const { announce = false, ...rootHandlers } = rootProps ?? {};
  const rootFocusable = rootProps !== undefined && focusTarget === "root";
  const hasHints = hints.length > 0;
  return (
    <div
      role="group"
      aria-label={label}
      aria-roledescription="interactive demo"
      tabIndex={rootFocusable ? 0 : undefined}
      aria-activedescendant={rootFocusable ? activeDescendant : undefined}
      aria-describedby={rootFocusable && hasHints ? hintsId : undefined}
      data-demo-focus={rootFocusable ? "" : undefined}
      {...rootHandlers}
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface font-mono text-sm shadow-2 focus-visible:focus-ring",
        className,
      )}
    >
      <FrameHeader title={title} toolbar={toolbar} onReplay={onReplay} />
      <div className={cn("min-h-0 flex-auto p-4", bodyClassName)}>{children}</div>
      <FrameStatus status={status} announce={announce} />
      <FrameHints id={hintsId} hints={hints} />
    </div>
  );
};
