import type { DemoHint } from "@/features/demos/engine/demo-frame";
import { DemoFrame } from "@/features/demos/engine/demo-frame";
import type { DemoRootProps } from "@/features/demos/engine/use-demo";
import { subscriptionSwitchDemo } from "@/features/demos/subscription-switch/definition";
import {
  currentTool,
  emptyHint,
  logLines,
  loginsFor,
  MAX_LOGINS,
  runningPrompt,
  statusText,
  TOOLS,
  toolTitle,
  type ConfirmChoice,
  type LogTone,
  type SwitchState,
  type SwitchTool,
} from "@/features/demos/subscription-switch/machine";
import { cn } from "@/shared/lib/cn";

export type SubscriptionSwitchViewProps = {
  state: SwitchState;
  idPrefix: string;
  hints?: readonly DemoHint[];
  onReplay?: () => void;
  rootProps?: DemoRootProps;
  onTab?: (tab: number) => void;
  onRow?: (row: number) => void;
  onToggleRunning?: () => void;
  onAnswer?: (choice: ConfirmChoice) => void;
};

const ROW_HEIGHT_REM = 2.25;

const tabId = (idPrefix: string, index: number): string => `${idPrefix}-tab-${index}`;
const panelId = (idPrefix: string): string => `${idPrefix}-panel`;
const rowId = (idPrefix: string, tool: SwitchTool, index: number): string => `${idPrefix}-${tool}-${index}`;

const activeRowId = (idPrefix: string, state: SwitchState, tool: SwitchTool): string | undefined =>
  state.phase.kind === "browse" && loginsFor(tool)[state.cursor] !== undefined
    ? rowId(idPrefix, tool, state.cursor)
    : undefined;

const TONE_CLASSES: Readonly<Record<LogTone, string>> = {
  step: "text-foreground",
  success: "text-success",
  warn: "text-foreground",
  muted: "text-muted",
};

const TONE_MARKERS: Readonly<Record<LogTone, string>> = {
  step: "·",
  success: "✔",
  warn: "!",
  muted: " ",
};

type ToolTabsProps = {
  idPrefix: string;
  activeTab: number;
  onTab?: (tab: number) => void;
};

const ToolTabs = ({ idPrefix, activeTab, onTab }: ToolTabsProps): React.JSX.Element => (
  <div role="tablist" aria-label="Tools" className="flex flex-wrap gap-x-1 gap-y-1 border-b border-hairline pb-3">
    {TOOLS.map((tool, index) => {
      const selected = index === activeTab;
      return (
        <div
          key={tool}
          id={tabId(idPrefix, index)}
          role="tab"
          aria-selected={selected}
          aria-controls={panelId(idPrefix)}
          onClick={onTab === undefined ? undefined : () => onTab(index)}
          className={cn(
            "rounded-xs px-2 py-1 text-xs whitespace-nowrap transition-colors dur-1",
            onTab !== undefined && "cursor-pointer",
            selected ? "bg-surface-3 text-foreground" : cn("text-muted", onTab !== undefined && "hover:text-foreground"),
          )}
        >
          {toolTitle(tool)}
        </div>
      );
    })}
  </div>
);

type LoginListProps = {
  idPrefix: string;
  state: SwitchState;
  tool: SwitchTool;
  onRow?: (row: number) => void;
};

const LoginList = ({ idPrefix, state, tool, onRow }: LoginListProps): React.JSX.Element => {
  const logins = loginsFor(tool);
  const browsing = state.phase.kind === "browse";
  const minHeight = `${MAX_LOGINS * ROW_HEIGHT_REM}rem`;
  if (logins.length === 0) {
    return (
      <p style={{ minHeight }} className="flex items-center px-2 text-xs text-muted">
        {emptyHint(tool)}
      </p>
    );
  }
  return (
    <ul
      role="listbox"
      aria-label={`${toolTitle(tool)} logins`}
      style={{ minHeight }}
      className="flex flex-col"
    >
      {logins.map((login, index) => {
        const focused = index === state.cursor && browsing;
        const active = state.active[tool] === login.name;
        return (
          <li
            key={login.name}
            id={rowId(idPrefix, tool, index)}
            role="option"
            aria-selected={index === state.cursor}
            onClick={onRow === undefined ? undefined : () => onRow(index)}
            style={{ minHeight: `${ROW_HEIGHT_REM}rem` }}
            className={cn(
              "flex items-center gap-2 rounded-xs px-2 transition-colors dur-1",
              onRow !== undefined && "cursor-pointer",
              focused ? "bg-surface-3" : onRow !== undefined && "hover:bg-surface-2",
            )}
          >
            <span aria-hidden="true" className={cn("w-3 shrink-0", focused ? "text-brand-text" : "text-transparent")}>
              ›
            </span>
            <span aria-hidden="true" className={cn("w-3 shrink-0", active ? "text-foreground" : "text-faint")}>
              {active ? "●" : "○"}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3">
              <span className={cn("shrink-0", active ? "font-semibold text-foreground" : "text-foreground")}>
                {login.name}
              </span>
              <span className="min-w-0 truncate text-xs text-muted">
                <bdi>{login.detail}</bdi>
              </span>
            </span>
            {active ? <span className="sr-only">(active)</span> : null}
          </li>
        );
      })}
    </ul>
  );
};

type RunningToggleProps = {
  tool: SwitchTool;
  running: boolean;
  onToggleRunning?: () => void;
};

const RunningToggle = ({ tool, running, onToggleRunning }: RunningToggleProps): React.JSX.Element => (
  <span
    aria-hidden="true"
    onClick={onToggleRunning}
    className={cn(
      "inline-flex items-center gap-2 rounded-xs px-2 py-1 text-xs text-muted transition-colors dur-1",
      onToggleRunning !== undefined && "cursor-pointer hover:text-foreground",
    )}
  >
    <span className="text-foreground">
      {running ? "[x]" : "[ ]"}
    </span>
    {toolTitle(tool)} is running
  </span>
);

type ConfirmPromptProps = {
  tool: SwitchTool;
  choice: ConfirmChoice;
  onAnswer?: (choice: ConfirmChoice) => void;
};

const CHOICES: readonly ConfirmChoice[] = ["yes", "no"];

const ConfirmPrompt = ({ tool, choice, onAnswer }: ConfirmPromptProps): React.JSX.Element => (
  <div className="flex flex-col gap-2">
    <p className="text-foreground">
      <span aria-hidden="true" className="mr-2 text-muted">
        ?
      </span>
      {runningPrompt(tool)}
    </p>
    <div role="radiogroup" aria-label="Switch anyway?" className="flex items-center gap-4 pl-5">
      {CHOICES.map((option) => {
        const selected = option === choice;
        return (
          <span
            key={option}
            role="radio"
            aria-checked={selected}
            onClick={onAnswer === undefined ? undefined : () => onAnswer(option)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xs px-1.5 py-0.5",
              onAnswer !== undefined && "cursor-pointer",
              selected ? "bg-surface-3 text-foreground" : cn("text-muted", onAnswer !== undefined && "hover:text-foreground"),
            )}
          >
            <span aria-hidden="true" className={selected ? "text-brand-text" : "text-faint"}>
              {selected ? "●" : "○"}
            </span>
            {option === "yes" ? "Yes" : "No"}
          </span>
        );
      })}
    </div>
  </div>
);

const LINE_STAGGER_MS = 220;

const SwitchLog = ({ state }: { state: SwitchState }): React.JSX.Element => (
  <ol aria-label="Switch output" className="flex flex-col gap-1">
    {logLines(state).map((line, index) => (
      <li
        key={`${state.run}-${index}`}
        style={{ transitionDelay: `${index * LINE_STAGGER_MS}ms` }}
        className={cn(
          "flex gap-2 break-words transition-opacity dur-2 starting:opacity-0 motion-reduce:transition-none",
          TONE_CLASSES[line.tone],
        )}
      >
        <span aria-hidden="true" className="w-3 shrink-0 text-faint">
          {TONE_MARKERS[line.tone]}
        </span>
        <span className="min-w-0">{line.text}</span>
      </li>
    ))}
  </ol>
);

export const SubscriptionSwitchView = ({
  state,
  idPrefix,
  hints,
  onReplay,
  rootProps,
  onTab,
  onRow,
  onToggleRunning,
  onAnswer,
}: SubscriptionSwitchViewProps): React.JSX.Element => {
  const tool = currentTool(state);
  return (
    <DemoFrame
      label={subscriptionSwitchDemo.label}
      title="yoink"
      status={statusText(state)}
      hints={hints}
      onReplay={onReplay}
      rootProps={rootProps}
      activeDescendant={activeRowId(idPrefix, state, tool)}
    >
      <div className="flex flex-col gap-3">
        <ToolTabs idPrefix={idPrefix} activeTab={state.tab} onTab={onTab} />
        <div
          id={panelId(idPrefix)}
          role="tabpanel"
          aria-labelledby={tabId(idPrefix, state.tab)}
          className="flex flex-col gap-2"
        >
          <LoginList idPrefix={idPrefix} state={state} tool={tool} onRow={onRow} />
          <div className="border-b border-hairline pb-2">
            <RunningToggle tool={tool} running={state.running[tool]} onToggleRunning={onToggleRunning} />
          </div>
        </div>
        <div className="min-h-56 text-xs leading-relaxed sm:min-h-40">
          {state.phase.kind === "confirm" ? (
            <ConfirmPrompt tool={tool} choice={state.phase.choice} onAnswer={onAnswer} />
          ) : (
            <SwitchLog state={state} />
          )}
        </div>
      </div>
    </DemoFrame>
  );
};
