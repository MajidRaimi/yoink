"use client";

import { useState, type ReactNode } from "react";
import type { SegmentedOption } from "@/features/landing/components/segmented-control";

export type Surface = "terminal" | "menubar";

export type SurfacePanel = {
  value: Surface;
  view: ReactNode;
  active: boolean;
};

export type SurfaceTabs = {
  options: readonly SegmentedOption<Surface>[];
  surface: Surface;
  select: (next: Surface) => void;
  panels: readonly SurfacePanel[];
};

const SURFACE_OPTIONS: readonly SegmentedOption<Surface>[] = [
  { value: "terminal", label: "Terminal" },
  { value: "menubar", label: "Menu bar" },
];

export const useSurfaceTabs = (views: Readonly<Record<Surface, ReactNode>>, initial: Surface = "terminal"): SurfaceTabs => {
  const [surface, select] = useState<Surface>(initial);
  const panels = SURFACE_OPTIONS.map((option) => ({
    value: option.value,
    view: views[option.value],
    active: option.value === surface,
  }));
  return { options: SURFACE_OPTIONS, surface, select, panels };
};
