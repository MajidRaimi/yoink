import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import { isExternalHref, type Href } from "@/shared/ui/href";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const base =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-button font-medium transition-[background-color,border-color,color,transform] dur-1 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:focus-ring";

const variants: Readonly<Record<ButtonVariant, string>> = {
  primary: "bg-brand text-on-brand hover:bg-brand-soft",
  secondary: "border border-hairline-strong bg-surface-2 text-foreground hover:bg-surface-3",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
};

const sizes: Readonly<Record<ButtonSize, string>> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4.5 text-sm",
  lg: "h-12 px-6 text-base",
};

const buttonStyles = ({ variant = "primary", size = "md", className }: ButtonStyleOptions = {}): string =>
  cx(base, variants[variant], sizes[size], className);

export type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: Href;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export const ButtonLink = ({ href, variant, size, className, children, ...props }: ButtonLinkProps): React.JSX.Element => {
  const classes = buttonStyles({ variant, size, className });
  if (isExternalHref(href)) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
};
