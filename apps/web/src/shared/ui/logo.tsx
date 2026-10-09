import Link from "next/link";
import { YOINK_MARK_PATH, YOINK_MARK_TRANSFORM, YOINK_MARK_VIEWBOX } from "@/shared/brand/mark";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/lib/routes";

export type YoinkMarkProps = {
  className?: string;
  title?: string;
};

export const YoinkMark = ({ className, title }: YoinkMarkProps): React.JSX.Element => (
  <svg
    viewBox={YOINK_MARK_VIEWBOX}
    fill="currentColor"
    className={className}
    role={title === undefined ? undefined : "img"}
    aria-hidden={title === undefined ? true : undefined}
    aria-label={title}
    focusable="false"
  >
    <path transform={YOINK_MARK_TRANSFORM} d={YOINK_MARK_PATH} />
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
