"use client";

import { useState, type ReactNode } from "react";
import { SegmentedControl, type SegmentedOption } from "@/features/landing/components/segmented-control";

export type Surface = "terminal" | "menubar";

const SURFACE_OPTIONS: readonly SegmentedOption<Surface>[] = [
  { value: "terminal", label: "Terminal" },
  { value: "menubar", label: "Menu bar" },
];

export type SurfaceSwitcherProps = {
  terminal: ReactNode;
  menubar: ReactNode;
  header: ReactNode;
};

const useSurface = (initial: Surface): readonly [Surface, (next: Surface) => void] => useState<Surface>(initial);

export const SurfaceSwitcher = ({ terminal, menubar, header }: SurfaceSwitcherProps): React.JSX.Element => {
  const [surface, setSurface] = useSurface("terminal");
  const views: Readonly<Record<Surface, ReactNode>> = { terminal, menubar };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
        {header}
        <SegmentedControl label="Surface" options={SURFACE_OPTIONS} value={surface} onChange={setSurface} />
      </div>
      <div className="grid min-h-[26rem] place-items-start md:place-items-center">
        {SURFACE_OPTIONS.map((option) => (
          <div key={option.value} hidden={option.value !== surface} className="w-full max-w-3xl md:mx-auto">
            {views[option.value]}
          </div>
        ))}
      </div>
    </div>
  );
};
