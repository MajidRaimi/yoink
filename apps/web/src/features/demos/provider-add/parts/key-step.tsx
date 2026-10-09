import { KeyIcon } from "@phosphor-icons/react/ssr";
import { ActionLine } from "@/features/demos/provider-add/parts/action-line";
import { ContinueLine } from "@/features/demos/provider-add/parts/continue-line";
import { textEvent } from "@/features/demos/provider-add/parts/events";
import { Caret } from "@/features/demos/provider-add/parts/caret";
import { ErrorLine } from "@/features/demos/provider-add/parts/error-line";
import { Line } from "@/features/demos/provider-add/parts/line";
import type { StepProps } from "@/features/demos/provider-add/parts/preset-step";
import { maskKey } from "@/features/demos/provider-add/selectors";
import { DEMO_KEY } from "@/features/demos/provider-add/script";

const CustomSourceLine = ({ state }: StepProps): React.JSX.Element | null => {
  const source = state.source;
  if (source === null || source.customBaseUrl === null) return null;
  return (
    <Line glyph="answered">
      <span className="truncate text-muted">{`${source.displayName}  ·  ${source.customBaseUrl}`}</span>
    </Line>
  );
};

const KeyAction = ({ state, onSend }: Pick<StepProps, "state" | "onSend">): React.JSX.Element =>
  state.key === "" ? (
    <ActionLine
      icon={KeyIcon}
      label="Use demo key"
      onActivate={onSend === undefined ? undefined : () => onSend([textEvent(DEMO_KEY)])}
    />
  ) : (
    <ContinueLine onSend={onSend} />
  );

export const KeyStep = ({ state, idPrefix, onSend }: StepProps): React.JSX.Element => (
  <>
    <CustomSourceLine state={state} idPrefix={idPrefix} />
    <Line glyph="active">
      <span className="text-foreground">API key</span>
      <span className="truncate text-faint">{state.source?.displayName}</span>
    </Line>
    <Line>
      <span className="flex min-w-0 items-center overflow-hidden">
        <span className="truncate text-foreground" aria-hidden="true">
          {maskKey(state.key)}
        </span>
        <Caret />
      </span>
    </Line>
    <KeyAction state={state} onSend={onSend} />
    <ErrorLine error={state.error} />
  </>
);
