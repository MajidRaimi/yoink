import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/cn";

export type IconProps = {
  icon: PhosphorIcon;
  size?: number;
  weight?: IconWeight;
  className?: string;
  label?: string;
};

export const Icon = ({ icon: Glyph, size = 16, weight = "regular", className, label }: IconProps): React.JSX.Element => (
  <Glyph
    size={size}
    weight={weight}
    className={cn("shrink-0", className)}
    aria-hidden={label === undefined ? true : undefined}
    aria-label={label}
    role={label === undefined ? undefined : "img"}
    focusable="false"
  />
);
