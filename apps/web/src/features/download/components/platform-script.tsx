"use client";

import { useIsHydrating } from "@/features/download/hooks/use-is-hydrating";
import { platformScript } from "@/features/download/lib/platform";

export const PlatformScript = (): React.JSX.Element | null => {
  const hydrating = useIsHydrating();
  return hydrating ? <script dangerouslySetInnerHTML={{ __html: platformScript }} /> : null;
};
