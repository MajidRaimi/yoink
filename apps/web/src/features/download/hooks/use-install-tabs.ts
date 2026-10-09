"use client";

import { useCallback, useId, useState, type KeyboardEvent } from "react";
import { usePlatform } from "@/features/download/hooks/use-platform";
import { INSTALL_TAB_IDS, installTabForPlatform, type InstallTabId } from "@/features/download/lib/install-options";
import { HORIZONTAL_ROVING_KEYS, rovingTarget } from "@/shared/lib/roving-index";
import { useFocusRegistry } from "@/shared/lib/use-focus-registry";

export type InstallTabProps = {
  id: string;
  role: "tab";
  type: "button";
  "aria-selected": boolean;
  "aria-controls": string;
  tabIndex: number;
  ref: (node: HTMLElement | null) => void;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

export type InstallPanelProps = {
  id: string;
  role: "tabpanel";
  "aria-labelledby": string;
  "aria-hidden": boolean;
  inert: boolean;
  tabIndex: number;
};

export type InstallTabs = {
  active: InstallTabId;
  tabProps: (id: InstallTabId) => InstallTabProps;
  panelProps: (id: InstallTabId) => InstallPanelProps;
};

export const useInstallTabs = (): InstallTabs => {
  const platform = usePlatform();
  const [chosen, setChosen] = useState<InstallTabId | null>(null);
  const baseId = useId();
  const { register, focus } = useFocusRegistry<InstallTabId>();
  const active = chosen ?? installTabForPlatform(platform);

  const focusTab = useCallback(
    (id: InstallTabId): void => {
      setChosen(id);
      focus(id);
    },
    [focus],
  );

  const tabProps = useCallback(
    (id: InstallTabId): InstallTabProps => ({
      id: `${baseId}-tab-${id}`,
      role: "tab",
      type: "button",
      "aria-selected": id === active,
      "aria-controls": `${baseId}-panel-${id}`,
      tabIndex: id === active ? 0 : -1,
      ref: register(id),
      onClick: () => setChosen(id),
      onKeyDown: (event) => {
        const nextId = rovingTarget(INSTALL_TAB_IDS, id, event.key, HORIZONTAL_ROVING_KEYS);
        if (nextId === undefined) return;
        event.preventDefault();
        focusTab(nextId);
      },
    }),
    [active, baseId, focusTab, register],
  );

  const panelProps = useCallback(
    (id: InstallTabId): InstallPanelProps => ({
      id: `${baseId}-panel-${id}`,
      role: "tabpanel",
      "aria-labelledby": `${baseId}-tab-${id}`,
      "aria-hidden": id !== active,
      inert: id !== active,
      tabIndex: 0,
    }),
    [active, baseId],
  );

  return { active, tabProps, panelProps };
};
