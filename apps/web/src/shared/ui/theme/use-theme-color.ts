"use client";

import { useTheme } from "next-themes";
import { themeColorFor } from "./theme-colors";

export const useThemeColor = (): string => {
  const { resolvedTheme } = useTheme();
  return themeColorFor(resolvedTheme);
};
