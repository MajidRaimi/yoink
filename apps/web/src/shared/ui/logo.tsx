import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/lib/routes";

export type YoinkMarkProps = {
  className?: string;
  title?: string;
};

export const YoinkMark = ({ className, title }: YoinkMarkProps): React.JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    role={title === undefined ? undefined : "img"}
    aria-hidden={title === undefined ? true : undefined}
    aria-label={title}
    focusable="false"
  >
    <path
      transform="matrix(0.014826 0 0 -0.014826 2.3855 21.8369)"
      d="M424 0V422L-26 1327H408L867 391V0ZM895 484 680 920 898 1327H1323Z"
    />
  </svg>
);

export type LogoProps = {
  className?: string;
};

export const Logo = ({ className }: LogoProps): React.JSX.Element => (
  <Link
    href={routes.home}
    aria-label="Yoink home"
    className={cn("inline-flex items-center gap-2 rounded-sm focus-visible:focus-ring", className)}
  >
    <span className="grid size-7 place-items-center rounded-sm bg-brand text-on-brand">
      <YoinkMark className="size-4.5" />
    </span>
    <span className="display text-lg tracking-tight">Yoink</span>
  </Link>
);
