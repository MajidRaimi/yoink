import type { DemoEvent } from "@/shared/contract";
import { Line } from "@/features/demos/provider-add/parts/line";
import { OptionList, type OptionRow } from "@/features/demos/provider-add/parts/option-list";
import type { State } from "@/features/demos/provider-add/machine";
import { PRESET_OPTIONS } from "@/features/demos/provider-add/sources";

export type StepProps = {
  state: State;
  idPrefix: string;
  onPick?: (index: number) => void;
  onSend?: (events: readonly DemoEvent[]) => void;
};

const PRESET_ROWS: readonly OptionRow[] = PRESET_OPTIONS.map((option) => ({
  key: option.id,
  label: option.label,
  hint: option.hint ?? undefined,
}));

export const PresetStep = ({ state, idPrefix, onPick }: StepProps): React.JSX.Element => (
  <>
    <Line glyph="active">
      <span className="text-foreground">Which provider?</span>
    </Line>
    <OptionList
      idPrefix={idPrefix}
      label="Which provider?"
      kind="radio"
      rows={PRESET_ROWS}
      cursor={state.presetCursor}
      windowSize={PRESET_ROWS.length}
      onPick={onPick}
    />
  </>
);
