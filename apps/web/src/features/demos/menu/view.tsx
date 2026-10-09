import type { ReactNode } from "react";
import { DemoFrame } from "@/features/demos/engine/demo-frame";
import type { DemoRootProps } from "@/features/demos/engine/use-demo";
import {
  CONNECT_PROMPT,
  enterLabelFor,
  helpItems,
  menuHints,
  outcomeLines,
  statusText,
  type OutcomeLines,
} from "@/features/demos/menu/format";
import { highlightedProfile, isCurrentProfile, type MenuState } from "@/features/demos/menu/machine";
import { MENU_GROUPS, MENU_PROFILES, SHOW_GROUP_TITLES, type MenuProfile } from "@/features/demos/menu/profiles";
import { cn } from "@/shared/lib/cn";
import { Kbd } from "@/shared/ui/kbd";

export type MenuViewControls = {
  rootProps: DemoRootProps;
  onReplay: () => void;
  onPick: (index: number) => void;
  onReopen: () => void;
};

export type MenuViewProps = {
  state: MenuState;
  controls?: MenuViewControls;
};

type GutterProps = {
  glyph?: string;
};

type LineProps = GutterProps & {
  children?: ReactNode;
};

type ProfileRowProps = {
  profile: MenuProfile;
  state: MenuState;
  onPick?: (index: number) => void;
};

type MenuListProps = {
  state: MenuState;
  onPick?: (index: number) => void;
};

type MenuSurfaceProps = {
  state: MenuState;
  controls?: MenuViewControls;
  children: ReactNode;
};

const HELP_LINE_ID = "menu-demo-help";

const Gutter = ({ glyph = "│" }: GutterProps): React.JSX.Element => (
  <span aria-hidden="true" className="w-[3ch] shrink-0 text-faint">
    {glyph}
  </span>
);

const Line = ({ glyph, children }: LineProps): React.JSX.Element => (
  <div className="flex h-5 min-w-0 items-center">
    <Gutter glyph={glyph} />
    {children}
  </div>
);

const Outcome = ({ lines }: { lines: OutcomeLines }): React.JSX.Element => {
  if (lines.kind === "empty") return <div className="h-[3.75rem] sm:h-10" />;
  const headline =
    lines.kind === "switched" ? (
      <span className="min-w-0 truncate">
        <span className="text-success">✔</span> Switched to{" "}
        <span className="font-semibold text-foreground">{lines.profile.name}</span>{" "}
        <span className="text-muted">({lines.profile.hint})</span>
      </span>
    ) : (
      <span className="min-w-0 truncate">
        <span className="text-muted">connect a provider:</span>{" "}
        <span className="font-semibold text-foreground">{lines.profile.name}</span>
      </span>
    );
  return (
    <div className="h-[3.75rem] overflow-hidden sm:h-10">
      <Line glyph="◇">{headline}</Line>
      <div className="flex min-w-0 items-start">
        <Gutter glyph="└" />
        <p className="line-clamp-2 min-w-0 text-muted">{lines.kind === "switched" ? lines.restart : CONNECT_PROMPT}</p>
      </div>
    </div>
  );
};

const ProfileRow = ({ profile, state, onPick }: ProfileRowProps): React.JSX.Element => {
  const index = MENU_PROFILES.indexOf(profile);
  const isCursor = index === state.cursor;
  const isCurrent = isCurrentProfile(state, profile);
  return (
    <div
      id={profile.id}
      role="option"
      aria-selected={isCursor}
      onClick={onPick === undefined ? undefined : (): void => onPick(index)}
      className={cn(
        "flex h-5 min-w-0 items-center",
        onPick !== undefined && "cursor-pointer rounded-xs transition-colors dur-1 hover:bg-surface-2",
      )}
    >
      <Gutter />
      <span aria-hidden="true" className={isCursor ? "text-brand-text" : "text-faint"}>
        {isCursor ? "●" : "○"}
      </span>
      <span className="ml-[1ch] min-w-0 truncate">
        <span
          className={cn(
            isCurrent ? "text-success" : isCursor ? "text-foreground" : "text-muted",
            isCursor && "font-semibold",
          )}
        >
          {profile.name}
        </span>
        <span className={isCursor ? "text-muted" : "sr-only"}> ({profile.hint})</span>
        {isCurrent ? <span className="sr-only">, active</span> : null}
      </span>
    </div>
  );
};

const HelpLine = ({ enterLabel }: { enterLabel: string }): React.JSX.Element => (
  <div id={HELP_LINE_ID} aria-hidden="true" className="flex min-h-10 min-w-0 items-start leading-5">
    <Gutter glyph="└" />
    <p className="flex min-w-0 flex-wrap gap-x-[1.5ch]">
      {helpItems(enterLabel).map((item) => (
        <span key={item.key} className="whitespace-nowrap">
          <span className="text-foreground">{item.key}</span> <span className="text-muted">{item.label}</span>
        </span>
      ))}
    </p>
  </div>
);

const MenuList = ({ state, onPick }: MenuListProps): React.JSX.Element => {
  const highlighted = highlightedProfile(state);
  return (
    <div>
      <div aria-hidden="true">
        <Line glyph="┌">
          <span className="rounded-xs bg-foreground px-[1ch] font-semibold text-background">yoink</span>
          <span className="ml-[1ch] truncate text-muted">switch accounts</span>
        </Line>
        <Line />
      </div>
      <div>
        {MENU_GROUPS.map((group) => (
          <div key={group.key} role="group" aria-label={group.title}>
            {SHOW_GROUP_TITLES ? (
              <Line>
                <span aria-hidden="true" className="truncate font-bold text-foreground">
                  {group.title}
                </span>
              </Line>
            ) : null}
            {group.profiles.map((profile) => (
              <ProfileRow key={profile.id} profile={profile} state={state} onPick={onPick} />
            ))}
          </div>
        ))}
      </div>
      <div aria-hidden="true">
        <Line />
      </div>
      <HelpLine enterLabel={enterLabelFor(highlighted)} />
    </div>
  );
};

const Collapsed = ({ onReopen }: { onReopen?: () => void }): React.JSX.Element => (
  <div>
    <Line glyph="$">
      <span className="text-foreground">yoink</span>
    </Line>
    <Line glyph="$">
      <span aria-hidden="true" className="inline-block h-4 w-[1ch] bg-brand" />
    </Line>
    {onReopen === undefined ? null : (
      <button
        type="button"
        onClick={onReopen}
        className="mt-4 inline-flex h-8 items-center gap-2 rounded-sm border border-hairline-strong px-3 text-xs text-foreground transition-colors dur-1 hover:bg-surface-2 focus-visible:focus-ring"
      >
        Run yoink again
        <Kbd>↵</Kbd>
      </button>
    )}
  </div>
);

const MenuSurface = ({ state, controls, children }: MenuSurfaceProps): React.JSX.Element => {
  const interactive = controls !== undefined;
  const a11y = state.open
    ? {
        role: "listbox",
        "aria-label": "Saved profiles",
        "aria-describedby": HELP_LINE_ID,
        "aria-activedescendant": interactive ? highlightedProfile(state)?.id : undefined,
      }
    : { role: "group", "aria-label": "yoink menu closed" };
  return (
    <div
      {...controls?.rootProps}
      {...a11y}
      tabIndex={interactive ? 0 : undefined}
      className="min-h-[27.5rem] min-w-0 rounded-xs text-xs leading-5 outline-none focus-visible:focus-ring sm:min-h-[26.25rem] sm:text-sm"
    >
      {children}
    </div>
  );
};

export const MenuView = ({ state, controls }: MenuViewProps): React.JSX.Element => (
  <DemoFrame
    label="Interactive yoink menu demo"
    title="~ yoink"
    status={statusText(state)}
    hints={controls === undefined ? [] : menuHints(state)}
    onReplay={controls?.onReplay}
  >
    <MenuSurface state={state} controls={controls}>
      <div aria-hidden="true">
        <Outcome lines={outcomeLines(state)} />
      </div>
      {state.open ? <MenuList state={state} onPick={controls?.onPick} /> : <Collapsed onReopen={controls?.onReopen} />}
    </MenuSurface>
  </DemoFrame>
);
