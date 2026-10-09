import { Caret } from "@/features/demos/provider-add/parts/caret";
import { ContinueLine } from "@/features/demos/provider-add/parts/continue-line";
import { EndpointsNote } from "@/features/demos/provider-add/parts/endpoints-note";
import { ErrorLine } from "@/features/demos/provider-add/parts/error-line";
import { Line } from "@/features/demos/provider-add/parts/line";
import { OptionList, type OptionRow } from "@/features/demos/provider-add/parts/option-list";
import type { StepProps } from "@/features/demos/provider-add/parts/preset-step";
import { filteredModels } from "@/features/demos/provider-add/machine";

const MODEL_WINDOW = 6;
const SEARCH_THRESHOLD = 12;

const promptText = (count: number): string =>
  count > SEARCH_THRESHOLD ? `Select models (${count} available, type to search, space to toggle)` : "Select models";

const FilterLine = ({ query }: { query: string }): React.JSX.Element => (
  <Line>
    <span className="flex min-w-0 items-center gap-1">
      {query === "" ? (
        <span className="truncate text-faint">type to filter</span>
      ) : (
        <span className="truncate text-foreground">{query}</span>
      )}
      <Caret />
    </span>
  </Line>
);

export const ModelsStep = ({ state, idPrefix, onPick, onSend }: StepProps): React.JSX.Element => {
  const available = state.source?.models.length ?? 0;
  const rows: readonly OptionRow[] = filteredModels(state).map((model) => ({
    key: model,
    label: model,
    checked: state.draftModels.includes(model),
  }));
  return (
    <>
      {state.source === null || state.editing ? null : <EndpointsNote source={state.source} />}
      <Line glyph="active">
        <span className="truncate text-foreground">{promptText(available)}</span>
      </Line>
      <FilterLine query={state.query} />
      <OptionList
        idPrefix={idPrefix}
        label="Select models"
        kind="checkbox"
        rows={rows}
        cursor={state.modelCursor}
        windowSize={MODEL_WINDOW}
        onPick={onPick}
        empty="No matches"
      />
      <ContinueLine onSend={onSend} />
      <ErrorLine error={state.error} />
    </>
  );
};
