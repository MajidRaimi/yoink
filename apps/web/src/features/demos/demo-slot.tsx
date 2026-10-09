import type { ComponentType } from "react";
import type { DemoId, DemoSlotProps } from "@/shared/contract";
import { LazyIsland } from "@/features/demos/lazy-island";
import { MenuStatic } from "@/features/demos/menu/static";
import { MenubarPanelStatic } from "@/features/demos/menubar-panel/static";
import { ProviderAddStatic } from "@/features/demos/provider-add/static";
import { SubscriptionSwitchStatic } from "@/features/demos/subscription-switch/static";

type StaticFrameProps = {
  idPrefix: string;
};

const STATIC_FRAMES: Readonly<Record<DemoId, ComponentType<StaticFrameProps>>> = {
  menu: MenuStatic,
  "provider-add": ProviderAddStatic,
  "subscription-switch": SubscriptionSwitchStatic,
  "menubar-panel": MenubarPanelStatic,
};

export const DemoSlot = ({ id, linked = false, className }: DemoSlotProps): React.JSX.Element => {
  const StaticFrame = STATIC_FRAMES[id];
  const idPrefix = linked ? `${id}-static-linked` : `${id}-static`;
  return <LazyIsland id={id} linked={linked} className={className} fallback={<StaticFrame idPrefix={idPrefix} />} />;
};
