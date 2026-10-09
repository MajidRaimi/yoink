"use client";

import { useInView, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import type { DemoDefinition, DemoEvent, DemoMode } from "@/shared/contract";
import { toDemoEvent } from "@/features/demos/engine/keymap";
import { createPlayerReducer, initPlayer } from "@/features/demos/engine/player";

export type UseDemoOptions<State> = {
  autoplay?: boolean;
  textMode?: (state: State) => boolean;
  viewAmount?: number;
};

export type DemoRootProps = {
  ref: RefObject<HTMLDivElement | null>;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
};

export type DemoController<State> = {
  state: State;
  mode: DemoMode;
  cursor: number;
  inView: boolean;
  reducedMotion: boolean;
  dispatch: (event: DemoEvent) => void;
  patch: (update: (state: State) => State) => void;
  replay: () => void;
  rootProps: DemoRootProps;
};

const NESTED_CONTROLS = "button, a[href], input, textarea, select, [contenteditable='true']";

const subscribeToNothing = (): (() => void) => () => undefined;

const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

const isNestedControl = (event: KeyboardEvent<HTMLElement>): boolean =>
  event.target !== event.currentTarget &&
  event.target instanceof Element &&
  event.target.closest(NESTED_CONTROLS) !== null;

export const useDemo = <State,>(
  definition: DemoDefinition<State>,
  options: UseDemoOptions<State> = {},
): DemoController<State> => {
  const { autoplay = true, textMode, viewAmount = 0.35 } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: viewAmount });
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;
  const motionKnown = prefersReducedMotion !== null;
  const hydrated = useHydrated();
  const reducer = useMemo(() => createPlayerReducer(definition), [definition]);
  const [player, send] = useReducer(reducer, definition, initPlayer);

  useEffect(() => {
    if (reducedMotion && player.mode === "auto") send({ type: "settle" });
  }, [reducedMotion, player.mode]);

  useEffect(() => {
    if (!autoplay || !motionKnown || reducedMotion || !inView || player.mode !== "idle") return;
    send({ type: "start" });
  }, [autoplay, motionKnown, reducedMotion, inView, player.mode]);

  useEffect(() => {
    if (player.mode !== "auto" || !inView) return;
    const step = definition.script[player.cursor];
    const timer = setTimeout(() => send({ type: "advance" }), step?.wait ?? 0);
    return () => clearTimeout(timer);
  }, [player.mode, player.cursor, inView, definition.script]);

  const dispatch = useCallback((event: DemoEvent): void => send({ type: "input", event }), []);

  const patch = useCallback((update: (state: State) => State): void => send({ type: "patch", update }), []);

  const replay = useCallback((): void => send({ type: reducedMotion ? "settle" : "start" }), [reducedMotion]);

  const takeOver = useCallback((): void => send({ type: "takeover" }), []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      if (isNestedControl(event)) return;
      const demoEvent = toDemoEvent(event, { textMode: textMode?.(player.demo) ?? false });
      if (demoEvent === null) return;
      event.preventDefault();
      send({ type: "input", event: demoEvent });
    },
    [textMode, player.demo],
  );

  const rootProps = useMemo<DemoRootProps>(
    () => ({ ref, onKeyDown, onPointerDown: takeOver, onFocus: takeOver }),
    [onKeyDown, takeOver],
  );

  return {
    state: player.demo,
    mode: player.mode,
    cursor: player.cursor,
    inView,
    reducedMotion: hydrated && reducedMotion,
    dispatch,
    patch,
    replay,
    rootProps,
  };
};
