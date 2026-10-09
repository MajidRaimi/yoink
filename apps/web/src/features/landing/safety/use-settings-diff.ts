"use client";

import { useMemo, useState } from "react";
import { useDisclosure } from "@/shared/lib/use-disclosure";
import {
  diffSummary,
  settingsDiff,
  writesManagedKeys,
  type DiffLine,
  type DiffMode,
} from "@/features/landing/safety/settings-diff-model";

export type SettingsDiffState = {
  mode: DiffMode;
  setMode: (next: DiffMode) => void;
  tracked: boolean;
  toggleTracked: () => void;
  lines: readonly DiffLine[];
  summary: string;
  skipped: boolean;
};

export const useSettingsDiff = (): SettingsDiffState => {
  const [mode, setMode] = useState<DiffMode>("apply");
  const { open: tracked, toggle: toggleTracked } = useDisclosure(false);
  const lines = useMemo(() => settingsDiff({ mode, tracked }), [mode, tracked]);
  return {
    mode,
    setMode,
    tracked,
    toggleTracked,
    lines,
    summary: diffSummary(lines),
    skipped: !writesManagedKeys({ mode, tracked }),
  };
};
