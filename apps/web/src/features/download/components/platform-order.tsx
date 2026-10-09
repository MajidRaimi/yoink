"use client";

import { Fragment, type ReactNode } from "react";
import { usePlatform } from "@/features/download/hooks/use-platform";

export type PlatformOrderProps = {
  mac: ReactNode;
  cli: ReactNode;
};

export const PlatformOrder = ({ mac, cli }: PlatformOrderProps): React.JSX.Element => {
  const platform = usePlatform();
  const sections = platform === "mac" ? [["mac", mac] as const, ["cli", cli] as const] : [["cli", cli] as const, ["mac", mac] as const];
  return (
    <>
      {sections.map(([key, node]) => (
        <Fragment key={key}>{node}</Fragment>
      ))}
    </>
  );
};
