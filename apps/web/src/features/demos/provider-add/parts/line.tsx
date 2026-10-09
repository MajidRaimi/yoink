import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type LineGlyph = "bar" | "active" | "answered" | "end" | "error";

export type LineProps = {
  glyph?: LineGlyph;
  className?: string;
  children?: ReactNode;
};

const GLYPHS: Readonly<Record<LineGlyph, string>> = {
  bar: "│",
  active: "◆",
  answered: "◇",
  end: "└",
  error: "▲",
};

const GLYPH_TONES: Readonly<Record<LineGlyph, string>> = {
  bar: "text-faint",
  active: "text-foreground",
  answered: "text-success",
  end: "text-faint",
  error: "text-danger",
};

export const Line = ({ glyph = "bar", className, children }: LineProps): React.JSX.Element => (
  <div className={cn("flex h-6 min-w-0 items-center gap-2", className)}>
    <span aria-hidden="true" className={cn("w-3 shrink-0 text-center", GLYPH_TONES[glyph])}>
      {GLYPHS[glyph]}
    </span>
    <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
  </div>
);
