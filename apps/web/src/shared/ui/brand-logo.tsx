import type { CSSProperties } from "react";
import type { BrandLogo } from "@/shared/brand/logos";
import { cn } from "@/shared/lib/cn";

export type BrandLogoGlyphProps = {
  logo: BrandLogo;
  className?: string;
  decorative?: boolean;
};

export const BrandLogoGlyph = ({ logo, className, decorative = false }: BrandLogoGlyphProps): React.JSX.Element => {
  const a11y = decorative ? { "aria-hidden": true } : { role: "img", "aria-label": logo.title };
  if (logo.source.kind === "path") {
    return (
      <svg viewBox={logo.source.viewBox} fill="currentColor" className={cn("size-5 shrink-0", className)} focusable="false" {...a11y}>
        <path d={logo.source.path} />
      </svg>
    );
  }
  const mask: CSSProperties = {
    maskImage: `url(${logo.source.src})`,
    WebkitMaskImage: `url(${logo.source.src})`,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskSize: "contain",
    WebkitMaskSize: "contain",
  };
  return <span className={cn("inline-block size-5 shrink-0 bg-current", className)} style={mask} {...a11y} />;
};
