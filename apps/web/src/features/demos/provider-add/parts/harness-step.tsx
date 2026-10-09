import { ContinueLine } from "@/features/demos/provider-add/parts/continue-line";
import { Line } from "@/features/demos/provider-add/parts/line";
import { OptionList, type OptionRow } from "@/features/demos/provider-add/parts/option-list";
import type { StepProps } from "@/features/demos/provider-add/parts/preset-step";
import { harnessRows } from "@/features/demos/provider-add/harness-rows";
import { sourceProtocols } from "@/features/demos/provider-add/sources";

const HARNESS_WINDOW = 8;
const EXPERIMENTAL_TAG = "experimental";

export const HarnessStep = ({ state, idPrefix, onPick, onSend }: StepProps): React.JSX.Element => {
  const rows: readonly OptionRow[] = harnessRows(state.source).map((row) => ({
    key: row.id,
    label: row.label,
    tag: row.experimental ? EXPERIMENTAL_TAG : undefined,
    hint: row.reason ?? row.path,
    checked: state.checked.includes(row.id),
    disabled: row.reason !== null,
  }));
  const source = state.source;
  const summary =
    source === null
      ? ""
      : `${source.displayName} · ${sourceProtocols(source).join(", ")} · ${state.savedModels.length} models`;
  return (
    <>
      <Line glyph="active">
        <span className="shrink-0 text-brand-text">{source?.profileName}</span>
        <span className="truncate text-faint">{summary}</span>
      </Line>
      <Line>
        <span className="truncate text-foreground">Connect to which harnesses?</span>
      </Line>
      <OptionList
        idPrefix={idPrefix}
        label="Connect to which harnesses?"
        kind="checkbox"
        rows={rows}
        cursor={state.harnessCursor}
        windowSize={HARNESS_WINDOW}
        onPick={onPick}
      />
      <ContinueLine onSend={onSend} />
    </>
  );
};
