import { Line } from "@/features/demos/provider-add/parts/line";
import { OptionList } from "@/features/demos/provider-add/parts/option-list";
import type { StepProps } from "@/features/demos/provider-add/parts/preset-step";
import { harnessCount, harnessLabel } from "@/features/demos/provider-add/harness-rows";
import { defaultOptions, defaultTargets, type State } from "@/features/demos/provider-add/machine";

const DEFAULT_WINDOW = 8;

const answeredText = (state: State): string =>
  state.claudeModel === null
    ? harnessCount(state.checked.length)
    : `${harnessCount(state.checked.length)}  ·  Claude Code ${state.claudeModel}`;

export const DefaultStep = ({ state, idPrefix, onPick }: StepProps): React.JSX.Element => {
  const message = `Default model in ${defaultTargets(state).map(harnessLabel).join(", ")}`;
  const rows = defaultOptions(state).map((option) => ({ key: option, label: option }));
  return (
    <>
      <Line glyph="answered">
        <span className="truncate text-muted">{answeredText(state)}</span>
      </Line>
      <Line glyph="active">
        <span className="truncate text-foreground">{message}</span>
      </Line>
      <OptionList
        idPrefix={idPrefix}
        label={message}
        kind="radio"
        rows={rows}
        cursor={state.defaultCursor}
        windowSize={DEFAULT_WINDOW}
        onPick={onPick}
      />
    </>
  );
};
