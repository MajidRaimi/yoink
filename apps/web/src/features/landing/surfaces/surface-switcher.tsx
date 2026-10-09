"use client";

import type { ReactNode } from "react";
import { SegmentedControl } from "@/features/landing/components/segmented-control";
import { useSurfaceTabs } from "@/features/landing/surfaces/use-surface-tabs";

export type { Surface } from "@/features/landing/surfaces/use-surface-tabs";

export type SurfaceSwitcherProps = {
  terminal: ReactNode;
  menubar: ReactNode;
  header: ReactNode;
};

export const SurfaceSwitcher = ({ terminal, menubar, header }: SurfaceSwitcherProps): React.JSX.Element => {
  const { options, surface, select, panels } = useSurfaceTabs({ terminal, menubar });

  return (
    <div className="flex w-full flex-col gap-10">
      {header}
      <div className="flex w-full min-w-0 flex-col items-start gap-4">
        <SegmentedControl label="Surface" options={options} value={surface} onChange={select} />
        <div className="grid min-h-[26rem] w-full place-items-start">
          {panels.map((panel) => (
            <div key={panel.value} hidden={!panel.active} className="w-full min-w-0">
              {panel.view}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
