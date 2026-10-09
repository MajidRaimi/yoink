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

const ProviderAddIsland = (): React.JSX.Element => {
  const demo = useDemo(providerAddDemo, { textMode });
  const idPrefix = useId();
  const { state, dispatch } = demo;
  const send = useCallback((events: readonly DemoEvent[]): void => events.forEach((event) => dispatch(event)), [dispatch]);
  const pick = useCallback((index: number): void => send(eventsToPick(state, index)), [state, send]);
  return (
    <ProviderAddView
      state={state}
      status={demo.mode === "auto" ? AUTOPLAY_STATUS : statusText(state)}
      idPrefix={idPrefix}
      onPick={pick}
      onSend={send}
      onReplay={demo.replay}
      rootProps={demo.rootProps}
    />
  );
};

export default ProviderAddIsland;
