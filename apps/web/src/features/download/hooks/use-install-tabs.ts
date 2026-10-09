"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import { usePlatform } from "@/features/download/hooks/use-platform";
import { INSTALL_TAB_IDS, installTabForPlatform, type InstallTabId } from "@/features/download/lib/install-options";
import { targetIndex } from "@/features/download/lib/tab-keys";

export type InstallTabProps = {
  id: string;
  role: "tab";
  type: "button";
  "aria-selected": boolean;
  "aria-controls": string;
  tabIndex: number;
  ref: (node: HTMLButtonElement | null) => void;
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
  const nodes = useRef(new Map<InstallTabId, HTMLButtonElement>());
  const active = chosen ?? installTabForPlatform(platform);

  const focusTab = useCallback((id: InstallTabId): void => {
    setChosen(id);
    nodes.current.get(id)?.focus();
  }, []);

  const tabProps = useCallback(
    (id: InstallTabId): InstallTabProps => ({
      id: `${baseId}-tab-${id}`,
      role: "tab",
      type: "button",
      "aria-selected": id === active,
      "aria-controls": `${baseId}-panel-${id}`,
      tabIndex: id === active ? 0 : -1,
      ref: (node) => {
        if (node === null) nodes.current.delete(id);
        else nodes.current.set(id, node);
      },
      onClick: () => setChosen(id),
      onKeyDown: (event) => {
        const next = targetIndex(event.key, INSTALL_TAB_IDS.indexOf(id), INSTALL_TAB_IDS.length);
        const nextId = next === null ? undefined : INSTALL_TAB_IDS[next];
        if (nextId === undefined) return;
        event.preventDefault();
        focusTab(nextId);
      },
    }),
    [active, baseId, focusTab],
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
