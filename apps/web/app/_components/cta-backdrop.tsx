"use client";

import { useTheme } from "next-themes";
import PixelBlast from "@/components/ui/pixel-blast";

export const CtaBackdrop = () => {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === "light" ? "#a16207" : "#facc15";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(120%_120%_at_50%_0%,#000_25%,transparent_72%)]"
    >
      <PixelBlast
        variant="circle"
        color={color}
        pixelSize={4}
        patternScale={2.4}
        patternDensity={0.9}
        pixelSizeJitter={0.4}
        speed={0.36}
        edgeFade={0.35}
        enableRipples={false}
        transparent
      />
    </div>
  );
};
