"use client";

import { useCallback } from "react";
import type { DemoHint } from "@/features/demos/engine/demo-frame";
import { keyLabel } from "@/features/demos/engine/keymap";
import { useDemo } from "@/features/demos/engine/use-demo";
import { subscriptionSwitchDemo } from "@/features/demos/subscription-switch/definition";
import {
  eventsToAnswer,
  eventsToRow,
  eventsToTab,
  type ConfirmChoice,
  type SwitchState,
} from "@/features/demos/subscription-switch/machine";
import { SubscriptionSwitchView } from "@/features/demos/subscription-switch/view";
import type { DemoEvent } from "@/shared/contract";

const BROWSE_HINTS: readonly DemoHint[] = [
  { keys: [keyLabel("left"), keyLabel("right")], action: "tool" },
  { keys: [keyLabel("up"), keyLabel("down")], action: "login" },
  { keys: [keyLabel("enter")], action: "switch" },
  { keys: [keyLabel("space")], action: "toggle running" },
];

const CONFIRM_HINTS: readonly DemoHint[] = [
  { keys: [keyLabel("left"), keyLabel("right")], action: "choose" },
  { keys: [keyLabel("enter")], action: "answer" },
  { keys: [keyLabel("escape")], action: "cancel" },
];

const SPACE: DemoEvent = { type: "key", key: "space" };

type SubscriptionSwitchActions = {
  onTab: (tab: number) => void;
  onRow: (row: number) => void;
  onToggleRunning: () => void;
  onAnswer: (choice: ConfirmChoice) => void;
};

const useSubscriptionSwitchActions = (
  state: SwitchState,
  dispatch: (event: DemoEvent) => void,
): SubscriptionSwitchActions => {
  const dispatchAll = useCallback(
    (events: readonly DemoEvent[]): void => events.forEach((event) => dispatch(event)),
    [dispatch],
  );
  const onTab = useCallback((tab: number): void => dispatchAll(eventsToTab(state, tab)), [dispatchAll, state]);
  const onRow = useCallback((row: number): void => dispatchAll(eventsToRow(state, row)), [dispatchAll, state]);
  const onToggleRunning = useCallback((): void => {
    if (state.phase.kind === "browse") dispatch(SPACE);
  }, [dispatch, state.phase.kind]);
  const onAnswer = useCallback(
    (choice: ConfirmChoice): void => dispatchAll(eventsToAnswer(state, choice)),
    [dispatchAll, state],
  );
  return { onTab, onRow, onToggleRunning, onAnswer };
};

const SubscriptionSwitchIsland = (): React.JSX.Element => {
  const { state, dispatch, replay, rootProps } = useDemo(subscriptionSwitchDemo);
  const actions = useSubscriptionSwitchActions(state, dispatch);
  return (
    <SubscriptionSwitchView
      state={state}
      hints={state.phase.kind === "confirm" ? CONFIRM_HINTS : BROWSE_HINTS}
      onReplay={replay}
      rootProps={rootProps}
      {...actions}
    />
  );
};

export default SubscriptionSwitchIsland;
