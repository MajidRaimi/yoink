"use client";

import { useCallback, useId } from "react";
import type { DemoEvent } from "@/shared/contract";
import { useDemo } from "@/features/demos/engine/use-demo";
import { providerAddDemo } from "@/features/demos/provider-add/definition";
import { isTextPhase, type State } from "@/features/demos/provider-add/machine";
import { eventsToPick, statusText } from "@/features/demos/provider-add/selectors";
import { ProviderAddView } from "@/features/demos/provider-add/view";

const AUTOPLAY_STATUS = "Playing: add OpenRouter, pick three models, connect pi, opencode and Qwen Code.";

const textMode = (state: State): boolean => isTextPhase(state);

type ProviderAddActions = {
  onPick: (index: number) => void;
  onSend: (events: readonly DemoEvent[]) => void;
};

const useProviderAddActions = (
  state: State,
  dispatchAll: (events: readonly DemoEvent[]) => void,
): ProviderAddActions => {
  const onPick = useCallback((index: number): void => dispatchAll(eventsToPick(state, index)), [dispatchAll, state]);
  return { onPick, onSend: dispatchAll };
};

const ProviderAddIsland = (): React.JSX.Element => {
  const idPrefix = useId();
  const { state, mode, dispatchAll, replay, rootProps } = useDemo(providerAddDemo, { textMode });
  const actions = useProviderAddActions(state, dispatchAll);
  return (
    <ProviderAddView
      state={state}
      status={mode === "auto" ? AUTOPLAY_STATUS : statusText(state)}
      idPrefix={idPrefix}
      onReplay={replay}
      rootProps={rootProps}
      {...actions}
    />
  );
};

export default ProviderAddIsland;
