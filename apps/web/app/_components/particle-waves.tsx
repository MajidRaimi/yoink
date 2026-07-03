"use client";

import { useTheme } from "next-themes";
import { useParticleWaves } from "../_hooks/use-particle-waves";

export const ParticleWaves = () => {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === "light" ? "#a16207" : "#fde047";
  const containerRef = useParticleWaves(color);

  return (
    <div
      aria-hidden
      className="wave-mask pointer-events-none absolute inset-x-0 bottom-0 h-[620px] overflow-hidden"
    >
      <div ref={containerRef} className="size-full" />
    </div>
  );
};
