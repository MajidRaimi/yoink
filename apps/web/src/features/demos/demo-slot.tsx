import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { DemoId, DemoSlotProps } from "@/shared/contract";
import MenuIsland from "@/features/demos/menu/island";
import { MenuStatic } from "@/features/demos/menu/static";
import { MenubarPanelStatic } from "@/features/demos/menubar-panel/static";
import { ProviderAddStatic } from "@/features/demos/provider-add/static";
import { SubscriptionSwitchStatic } from "@/features/demos/subscription-switch/static";
import { cn } from "@/shared/lib/cn";

const STATIC_FRAMES: Readonly<Record<DemoId, ComponentType>> = {
  menu: MenuStatic,
  "provider-add": ProviderAddStatic,
  "subscription-switch": SubscriptionSwitchStatic,
  "menubar-panel": MenubarPanelStatic,
};

const LAZY_ISLANDS: Readonly<Record<DemoId, ComponentType>> = {
  menu: dynamic(() => import("@/features/demos/menu/island"), { loading: MenuStatic }),
  "provider-add": dynamic(() => import("@/features/demos/provider-add/island"), { loading: ProviderAddStatic }),
  "subscription-switch": dynamic(() => import("@/features/demos/subscription-switch/island"), {
    loading: SubscriptionSwitchStatic,
  }),
  "menubar-panel": dynamic(() => import("@/features/demos/menubar-panel/island"), { loading: MenubarPanelStatic }),
};

export const staticFrameFor = (id: DemoId): ComponentType => STATIC_FRAMES[id];

export const DemoSlot = ({ id, eager = false, className }: DemoSlotProps): React.JSX.Element => {
  const Island = eager && id === "menu" ? MenuIsland : LAZY_ISLANDS[id];
  return (
    <div className={cn("min-w-0", className)}>
      <Island />
    </div>
  );
};
