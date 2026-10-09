import type { ComponentType } from "react";
import type { DemoEvent } from "@/shared/contract";
import { DemoFrame } from "@/features/demos/engine/demo-frame";
import type { DemoRootProps } from "@/features/demos/engine/use-demo";
import { PHASE_HINTS } from "@/features/demos/provider-add/hints";
import { activeOptionId } from "@/features/demos/provider-add/selectors";
import type { Phase, State } from "@/features/demos/provider-add/machine";
import { CancelledStep } from "@/features/demos/provider-add/parts/cancelled-step";
import { DefaultStep } from "@/features/demos/provider-add/parts/default-step";
import { DoneStep } from "@/features/demos/provider-add/parts/done-step";
import { HarnessStep } from "@/features/demos/provider-add/parts/harness-step";
import { KeyStep } from "@/features/demos/provider-add/parts/key-step";
import { ModelsStep } from "@/features/demos/provider-add/parts/models-step";
import { PresetStep, type StepProps } from "@/features/demos/provider-add/parts/preset-step";
import { Trail } from "@/features/demos/provider-add/parts/trail";

export const PROVIDER_ADD_LABEL = "Add a provider demo";
export const PROVIDER_ADD_ID_PREFIX = "provider-add";

const STEPS: Readonly<Record<Phase, ComponentType<StepProps>>> = {
  preset: PresetStep,
  key: KeyStep,
  models: ModelsStep,
  harnesses: HarnessStep,
  claudeDefault: DefaultStep,
  default: DefaultStep,
  done: DoneStep,
  cancelled: CancelledStep,
};

export type ProviderAddViewProps = {
  state: State;
  status: string;
  idPrefix?: string;
  onPick?: (index: number) => void;
  onSend?: (events: readonly DemoEvent[]) => void;
  onReplay?: () => void;
  rootProps?: DemoRootProps;
  className?: string;
};

export const ProviderAddView = ({
  state,
  status,
  idPrefix = PROVIDER_ADD_ID_PREFIX,
  onPick,
  onSend,
  onReplay,
  rootProps,
  className,
}: ProviderAddViewProps): React.JSX.Element => {
  const Step = STEPS[state.phase];
  return (
    <DemoFrame
      label={PROVIDER_ADD_LABEL}
      title="yoink  ›  Add a provider"
      status={status}
      hints={PHASE_HINTS[state.phase]}
      onReplay={onReplay}
      rootProps={rootProps}
      activeDescendant={activeOptionId(state, idPrefix)}
      className={className}
      bodyClassName="h-[23rem] overflow-hidden px-3 py-4 text-xs leading-6 sm:px-4"
    >
      <Trail state={state} />
      <Step state={state} idPrefix={idPrefix} onPick={onPick} onSend={onSend} />
    </DemoFrame>
  );
};
