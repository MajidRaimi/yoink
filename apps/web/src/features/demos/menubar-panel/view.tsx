import { ArrowLeftIcon, CaretDownIcon, CheckIcon, GearSixIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import type { DemoEvent } from "@/shared/contract";
import { DemoFrame, type DemoHint } from "@/features/demos/engine/demo-frame";
import type { DemoRootProps } from "@/features/demos/engine/use-demo";
import { HARNESSES, type HarnessId } from "@/features/demos/data/harnesses.gen";
import {
  HARNESS_PICKER_HEIGHT,
  HARNESS_ROW_HEIGHT,
  HARNESS_VIEWPORT_HEIGHT,
  activeHarnessRow,
  connectionsFor,
  eventsForDialog,
  eventsToCycleDefault,
  eventsToOpenProfile,
  eventsToToggleHarness,
  harnessRows,
  providerProfile,
  selectedProfileIndex,
  showsDefaultModel,
  visibleHarnessCount,
  visibleProfiles,
  type DialogButton,
  type HarnessRowState,
  type PanelDialog,
  type PanelState,
} from "@/features/demos/menubar-panel/machine";
import { harnessLabel, type PanelProfile, type ProviderPanelProfile } from "@/features/demos/menubar-panel/panel-data";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";
import { YoinkMark } from "@/shared/ui/logo";

export type PanelInput = (events: readonly DemoEvent[]) => void;

export type MenubarPanelViewProps = {
  state: PanelState;
  idPrefix: string;
  onInput?: PanelInput;
  onReplay?: () => void;
  rootProps?: DemoRootProps;
};

type InputProps = {
  state: PanelState;
  idPrefix: string;
  onInput?: PanelInput;
};

const VISIBLE_CHIPS = 3;

const LIST_HINTS: readonly DemoHint[] = [
  { keys: ["↑", "↓"], action: "navigate" },
  { keys: ["Enter"], action: "open" },
  { keys: ["abc"], action: "search" },
];

const HARNESS_HINTS: readonly DemoHint[] = [
  { keys: ["↑", "↓"], action: "move" },
  { keys: ["Space"], action: "toggle" },
  { keys: ["Esc"], action: "back" },
];

const DEFAULT_MODEL_HINTS: readonly DemoHint[] = [
  { keys: ["↑", "↓"], action: "move" },
  { keys: ["Space"], action: "toggle" },
  { keys: ["←", "→"], action: "model" },
];

const DIALOG_HINTS: readonly DemoHint[] = [
  { keys: ["←", "→"], action: "pick" },
  { keys: ["Enter"], action: "confirm" },
  { keys: ["Esc"], action: "cancel" },
];

const activeRowShowsDefault = (state: PanelState): boolean => {
  const active = activeHarnessRow(state);
  return active !== null && showsDefaultModel(active.row, active.provider);
};

const hintsFor = (state: PanelState): readonly DemoHint[] => {
  if (state.dialog !== null) return DIALOG_HINTS;
  if (state.view === "list") return LIST_HINTS;
  return activeRowShowsDefault(state) ? DEFAULT_MODEL_HINTS : HARNESS_HINTS;
};

const modelSummary = (count: number): string => `${count} ${count === 1 ? "model" : "models"}`;

const optionId = (idPrefix: string, kind: string, key: string): string => `${idPrefix}-${kind}-${key}`;

const activeOptionId = (state: PanelState, idPrefix: string): string | undefined => {
  if (state.dialog !== null) return undefined;
  if (state.view === "harnesses") {
    const active = activeHarnessRow(state);
    return active === null ? undefined : optionId(idPrefix, "harness", active.row.id);
  }
  const selected = visibleProfiles(state)[selectedProfileIndex(state)];
  return selected === undefined ? undefined : optionId(idPrefix, "profile", selected.name);
};

const PanelHeader = (): React.JSX.Element => (
  <div className="flex h-10 shrink-0 items-center justify-between border-b border-hairline pr-2.5 pl-3.5">
    <div className="flex items-center gap-2">
      <YoinkMark className="size-4 text-foreground" />
      <span className="text-[13px] text-foreground">Yoink</span>
    </div>
    <div aria-hidden="true" className="flex items-center gap-0.5 text-muted">
      <span className="p-1.5">
        <Icon icon={PlusIcon} size={14} />
      </span>
      <span className="p-1.5">
        <Icon icon={GearSixIcon} size={14} />
      </span>
    </div>
  </div>
);

const HarnessChips = ({ connections }: { connections: readonly HarnessId[] }): React.JSX.Element | null => {
  if (connections.length === 0) return null;
  const visible = connections.slice(0, VISIBLE_CHIPS);
  const hidden = connections.length - visible.length;
  const chips = hidden > 0 ? [...visible.map(harnessLabel), `+${hidden}`] : visible.map(harnessLabel);
  return (
    <span className="flex shrink-0 items-center gap-1">
      <span className="sr-only">{`, connected to ${connections.map(harnessLabel).join(", ")}`}</span>
      {chips.map((chip) => (
        <span
          key={chip}
          aria-hidden="true"
          className="rounded-xs border border-hairline bg-surface px-1 text-[10px] leading-4 text-muted"
        >
          {chip}
        </span>
      ))}
    </span>
  );
};

const SecondaryLine = ({ profile, state }: { profile: PanelProfile; state: PanelState }): React.JSX.Element => (
  <span className="flex min-w-0 items-center gap-1.5">
    <span className="min-w-0 truncate text-[11px] text-muted">
      <bdi>{profile.type === "claude" ? profile.email : `${profile.provider} · ${modelSummary(profile.models.length)}`}</bdi>
    </span>
    {profile.type === "external" ? <HarnessChips connections={connectionsFor(state, profile.name)} /> : null}
  </span>
);

const SelectionBar = (): React.JSX.Element => (
  <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-0.5 rounded-pill bg-brand-text" />
);

const ProfileRow = ({
  profile,
  index,
  state,
  idPrefix,
  onInput,
}: InputProps & { profile: PanelProfile; index: number }): React.JSX.Element => {
  const selected = index === selectedProfileIndex(state);
  const active = profile.name === state.current;
  return (
    <div
      id={optionId(idPrefix, "profile", profile.name)}
      role="option"
      aria-selected={selected}
      onClick={onInput === undefined ? undefined : () => onInput(eventsToOpenProfile(state, index))}
      className={cn(
        "relative flex items-center gap-2.5 rounded-sm px-2.5 py-1.5",
        onInput !== undefined && "cursor-pointer",
        selected && "bg-surface-2",
      )}
    >
      {selected ? <SelectionBar /> : null}
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-pill", active ? "bg-brand-text" : "border border-faint")}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("truncate text-[13px] text-foreground", active && "font-semibold")}>
            <bdi>{profile.name}</bdi>
          </span>
          {active ? <span className="sr-only">, active</span> : null}
        </span>
        <SecondaryLine profile={profile} state={state} />
      </span>
    </div>
  );
};

const SearchField = ({ state }: { state: PanelState }): React.JSX.Element => (
  <div className="shrink-0 px-3 pt-3 pb-2">
    <div className="flex items-center rounded-md border border-hairline-strong bg-surface px-3 py-1.5 text-[13px]">
      <span className="sr-only">Search profiles: </span>
      {state.query.length === 0 ? null : <bdi className="truncate text-foreground">{state.query}</bdi>}
      {state.dialog === null ? <span aria-hidden="true" className="h-4 w-px shrink-0 bg-brand" /> : null}
      {state.query.length === 0 ? <span className="truncate pl-1 text-muted">Search profiles</span> : null}
    </div>
  </div>
);

const ProfileListView = ({ state, idPrefix, onInput }: InputProps): React.JSX.Element => {
  const profiles = visibleProfiles(state);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SearchField state={state} />
      <div
        role="listbox"
        aria-label="Profiles"
        className="min-h-0 flex-1 overflow-hidden px-1.5 pb-2"
      >
        {profiles.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted">
            No matches for &quot;<bdi>{state.query}</bdi>&quot;
          </p>
        ) : (
          profiles.map((profile, index) => (
            <ProfileRow
              key={profile.name}
              profile={profile}
              index={index}
              state={state}
              idPrefix={idPrefix}
              onInput={onInput}
            />
          ))
        )}
      </div>
    </div>
  );
};

const CheckMark = ({ checked, disabled }: { checked: boolean; disabled: boolean }): React.JSX.Element => (
  <span
    aria-hidden="true"
    className={cn(
      "flex size-3.5 shrink-0 items-center justify-center rounded-xs border",
      checked ? "border-foreground bg-foreground text-background" : "border-hairline-strong bg-surface",
      disabled && "opacity-40",
    )}
  >
    {checked ? <Icon icon={CheckIcon} size={10} weight="bold" /> : null}
  </span>
);

const DefaultModel = ({
  row,
  provider,
  state,
  index,
  onInput,
}: {
  row: HarnessRowState;
  provider: ProviderPanelProfile;
  state: PanelState;
  index: number;
  onInput?: PanelInput;
}): React.JSX.Element | null => {
  if (!showsDefaultModel(row, provider)) return null;
  return (
    <span className="flex items-start gap-2 pl-6" style={{ height: HARNESS_PICKER_HEIGHT }}>
      <span className="shrink-0 text-[11px] text-muted">Default</span>
      <span
        onClick={
          onInput === undefined
            ? undefined
            : (event) => {
                event.stopPropagation();
                onInput(eventsToCycleDefault(state, index));
              }
        }
        className={cn(
          "flex h-6 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-hairline-strong bg-surface px-2 text-[11px] leading-4",
          onInput !== undefined && "cursor-pointer",
        )}
      >
        <bdi className={cn("truncate", row.defaultModel === null ? "text-muted" : "text-foreground")}>
          {row.defaultModel ?? "Harness default"}
        </bdi>
        <Icon icon={CaretDownIcon} size={11} className="text-muted" />
      </span>
    </span>
  );
};

const HarnessRow = ({
  row,
  index,
  provider,
  state,
  idPrefix,
  onInput,
}: InputProps & { row: HarnessRowState; index: number; provider: ProviderPanelProfile }): React.JSX.Element => {
  const selected = index === state.harnessIndex;
  return (
    <div
      id={optionId(idPrefix, "harness", row.id)}
      role="option"
      aria-selected={selected}
      aria-checked={row.connected}
      aria-disabled={!row.selectable}
      onClick={onInput === undefined ? undefined : () => onInput(eventsToToggleHarness(state, index))}
      className={cn(
        "relative rounded-sm px-2.5",
        onInput !== undefined && row.selectable && "cursor-pointer",
        selected && "bg-surface-2",
      )}
    >
      {selected ? <SelectionBar /> : null}
      <span className="flex items-center gap-2.5" style={{ height: HARNESS_ROW_HEIGHT }}>
        <CheckMark checked={row.connected} disabled={!row.selectable} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className={cn("truncate text-[13px] leading-5", row.selectable ? "text-foreground" : "text-muted")}>
              {row.label}
            </span>
            {row.exclusive ? <span className="shrink-0 text-[10px] text-muted">one at a time</span> : null}
            {row.experimental ? <span className="shrink-0 text-[10px] text-muted">experimental</span> : null}
          </span>
          <span className="block truncate text-[11px] leading-4 text-muted">
            <bdi>{row.detail}</bdi>
          </span>
        </span>
        {row.stateLabel.length === 0 ? null : (
          <span className={cn("shrink-0 text-[10px]", row.connected ? "text-foreground" : "text-muted")}>
            {row.stateLabel}
          </span>
        )}
      </span>
      <DefaultModel row={row} provider={provider} state={state} index={index} onInput={onInput} />
    </div>
  );
};

const ScrollThumb = ({ offset, count }: { offset: number; count: number }): React.JSX.Element => (
  <span aria-hidden="true" className="absolute inset-y-0 right-0 w-1">
    <span
      className="absolute right-0 w-1 rounded-pill bg-hairline-strong"
      style={{
        top: `${(offset / HARNESSES.length) * 100}%`,
        height: `${(count / HARNESSES.length) * 100}%`,
      }}
    />
  </span>
);

const HarnessChecklistView = ({
  state,
  idPrefix,
  onInput,
  provider,
}: InputProps & { provider: ProviderPanelProfile }): React.JSX.Element => {
  const rows = harnessRows(state, provider);
  const visible = rows.slice(state.harnessOffset);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 px-3 pt-3">
        <button
          type="button"
          aria-label="Back to profiles"
          tabIndex={onInput === undefined ? -1 : undefined}
          onClick={onInput === undefined ? undefined : () => onInput([{ type: "key", key: "escape" }])}
          className="rounded-sm p-1.5 text-muted transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring"
        >
          <Icon icon={ArrowLeftIcon} size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-medium text-foreground">{provider.name}</p>
          <p className="truncate text-[11px] text-muted">
            <bdi>{`${provider.provider} · ${modelSummary(provider.models.length)}`}</bdi>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2.5 px-3 pt-3">
        <div aria-hidden="true" className="flex rounded-pill border border-hairline bg-surface p-0.5 text-[11px]">
          <span className="flex-1 rounded-pill bg-surface-3 px-3 py-1 text-center text-foreground">Harnesses</span>
          <span className="flex-1 px-3 py-1 text-center text-muted">Models</span>
        </div>
      </div>
      <div
        className="relative mx-1.5 mt-2.5 shrink-0 overflow-hidden pr-1.5"
        style={{ height: HARNESS_VIEWPORT_HEIGHT }}
      >
        <div
          role="listbox"
          aria-label={`Harnesses for ${provider.name}`}
        >
          {visible.map((row, position) => (
            <HarnessRow
              key={row.id}
              row={row}
              index={state.harnessOffset + position}
              provider={provider}
              state={state}
              idPrefix={idPrefix}
              onInput={onInput}
            />
          ))}
        </div>
        <ScrollThumb offset={state.harnessOffset} count={visibleHarnessCount(state, provider)} />
      </div>
    </div>
  );
};

type DialogCopy = {
  body: string;
  confirm: string;
};

const dialogCopy = (dialog: PanelDialog): DialogCopy =>
  dialog.kind === "switch"
    ? {
        body: `A live session can overwrite the switched credentials on its next refresh. Switching to ${dialog.name} may not stick until it exits.`,
        confirm: "Switch anyway",
      }
    : {
        body: `A live session keeps its current provider until it restarts. Connect ${dialog.provider} anyway?`,
        confirm: "Connect anyway",
      };

const dialogButtonClass = (focused: boolean): string =>
  cn(
    "rounded-pill border px-4 py-1.5 text-xs transition-colors dur-1 focus-visible:focus-ring",
    focused
      ? "border-brand bg-brand font-medium text-on-brand"
      : "border-hairline-strong bg-surface text-foreground",
  );

const focusEvents = (button: DialogButton): readonly DemoEvent[] => [
  { type: "key", key: button === "cancel" ? "left" : "right" },
];

const ConfirmDialog = ({
  dialog,
  state,
  idPrefix,
  onInput,
}: InputProps & { dialog: PanelDialog }): React.JSX.Element => {
  const copy = dialogCopy(dialog);
  const titleId = `${idPrefix}-dialog-title`;
  const bodyId = `${idPrefix}-dialog-body`;
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 px-5">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="w-full rounded-lg border border-hairline-strong bg-background p-4 shadow-2"
      >
        <p id={titleId} className="font-sans text-sm font-medium text-foreground">
          Claude Code is running
        </p>
        <p id={bodyId} className="mt-1.5 font-sans text-xs leading-relaxed text-muted">
          {copy.body}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            tabIndex={onInput === undefined ? -1 : undefined}
            onFocus={onInput === undefined ? undefined : () => onInput(focusEvents("cancel"))}
            onClick={onInput === undefined ? undefined : () => onInput(eventsForDialog("cancel"))}
            className={dialogButtonClass(state.dialogFocus === "cancel")}
          >
            Cancel
          </button>
          <button
            type="button"
            tabIndex={onInput === undefined ? -1 : undefined}
            onFocus={onInput === undefined ? undefined : () => onInput(focusEvents("confirm"))}
            onClick={onInput === undefined ? undefined : () => onInput(eventsForDialog("confirm"))}
            className={dialogButtonClass(state.dialogFocus === "confirm")}
          >
            {copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

const PanelBody = ({ state, idPrefix, onInput }: InputProps): React.JSX.Element => {
  const provider = state.view === "harnesses" ? providerProfile(state.provider) : null;
  return provider === null ? (
    <ProfileListView state={state} idPrefix={idPrefix} onInput={onInput} />
  ) : (
    <HarnessChecklistView state={state} idPrefix={idPrefix} onInput={onInput} provider={provider} />
  );
};

export const MenubarPanelView = ({
  state,
  idPrefix,
  onInput,
  onReplay,
  rootProps,
}: MenubarPanelViewProps): React.JSX.Element => (
  <DemoFrame
    label="Yoink menu bar app demo"
    title="Yoink menu bar"
    status={state.status}
    hints={hintsFor(state)}
    onReplay={onReplay}
    rootProps={rootProps}
    activeDescendant={activeOptionId(state, idPrefix)}
    bodyClassName="p-0"
  >
    <div className="relative mx-auto flex h-[28rem] w-full max-w-[24rem] flex-col border-hairline min-[26rem]:border-x">
      <div inert={state.dialog !== null} className="flex min-h-0 flex-1 flex-col">
        <PanelHeader />
        <PanelBody state={state} idPrefix={idPrefix} onInput={onInput} />
      </div>
      {state.dialog === null ? null : (
        <ConfirmDialog dialog={state.dialog} state={state} idPrefix={idPrefix} onInput={onInput} />
      )}
    </div>
  </DemoFrame>
);
