import type { CSSProperties } from "react";
import type { BrandLogo } from "@/shared/brand/logos";
import { cx } from "@/shared/lib/cx";

export type BrandLogoGlyphSize = "md" | "lg";

export type BrandLogoGlyphProps = {
  logo: BrandLogo;
  size?: BrandLogoGlyphSize;
  className?: string;
  decorative?: boolean;
};

const sizes: Readonly<Record<BrandLogoGlyphSize, string>> = {
  md: "size-5",
  lg: "size-6",
};

export const BrandLogoGlyph = ({ logo, size = "md", className, decorative = false }: BrandLogoGlyphProps): React.JSX.Element => {
  const a11y = decorative ? { "aria-hidden": true } : { role: "img", "aria-label": logo.title };
  if (logo.source.kind === "path") {
    return (
      <svg viewBox={logo.source.viewBox} fill="currentColor" className={cx("shrink-0", sizes[size], className)} focusable="false" {...a11y}>
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
  return <span className={cx("inline-block shrink-0 bg-current", sizes[size], className)} style={mask} {...a11y} />;
};
