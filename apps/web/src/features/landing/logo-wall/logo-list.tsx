import type { BrandLogo } from "@/shared/brand/logos";
import { BrandLogoGlyph } from "@/shared/ui/brand-logo";

export type LogoListProps = {
  logos: readonly BrandLogo[];
  className?: string;
  hidden?: boolean;
};

export const LogoList = ({ logos, className, hidden = false }: LogoListProps): React.JSX.Element => (
  <ul className={className} aria-hidden={hidden ? true : undefined}>
    {logos.map((logo) => (
      <li key={logo.id} className="flex items-center gap-2.5 text-muted">
        <BrandLogoGlyph logo={logo} decorative className="size-6" />
        <span className="font-mono text-sm whitespace-nowrap tracking-mono">{logo.title}</span>
      </li>
    ))}
  </ul>
);
