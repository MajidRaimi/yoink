"use client";

import { type ComponentType, lazy, type ReactNode, Suspense } from "react";
import type { DemoId } from "@/shared/contract";
import type { DemoIslandProps } from "@/features/demos/linked/types";
import { useIslandActivation } from "@/features/demos/use-island-activation";
import { useOnMount } from "@/features/demos/use-on-mount";
import { cx } from "@/shared/lib/cx";

type IslandModule = { default: ComponentType<DemoIslandProps> };

const ISLAND_LOADERS: Readonly<Record<DemoId, () => Promise<IslandModule>>> = {
  menu: () => import("@/features/demos/menu/island"),
  "provider-add": () => import("@/features/demos/provider-add/island"),
  "subscription-switch": () => import("@/features/demos/subscription-switch/island"),
  "menubar-panel": () => import("@/features/demos/menubar-panel/island"),
};

const LAZY_ISLANDS: Readonly<Record<DemoId, ComponentType<DemoIslandProps>>> = {
  menu: lazy(ISLAND_LOADERS.menu),
  "provider-add": lazy(ISLAND_LOADERS["provider-add"]),
  "subscription-switch": lazy(ISLAND_LOADERS["subscription-switch"]),
  "menubar-panel": lazy(ISLAND_LOADERS["menubar-panel"]),
};

const PRELOAD_MARGIN = "200px";

type LazyIslandProps = {
  id: DemoId;
  linked: boolean;
  fallback: ReactNode;
  className?: string;
};

type ReadyIslandProps = {
  Island: ComponentType<DemoIslandProps>;
  linked: boolean;
  onReady: () => void;
};

const ReadyIsland = ({ Island, linked, onReady }: ReadyIslandProps): React.JSX.Element => {
  useOnMount(onReady);
  return <Island linked={linked} />;
};

export const LazyIsland = ({ id, linked, fallback, className }: LazyIslandProps): React.JSX.Element => {
  const { ref, isActive, isReady, activateOnFocus, handOffFocus } = useIslandActivation<HTMLDivElement>(PRELOAD_MARGIN);
  const Island = LAZY_ISLANDS[id];
  const isPlaceholder = !isReady;
  return (
    <div
      ref={ref}
      role={isPlaceholder ? "group" : undefined}
      aria-label={isPlaceholder ? "Interactive demo" : undefined}
      aria-busy={isPlaceholder && isActive ? true : undefined}
      tabIndex={isPlaceholder ? 0 : undefined}
      onFocus={isPlaceholder ? activateOnFocus : undefined}
      className={cx("min-w-0 rounded-lg focus-visible:focus-ring", className)}
    >
      {isActive ? (
        <Suspense fallback={fallback}>
          <ReadyIsland Island={Island} linked={linked} onReady={handOffFocus} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};
