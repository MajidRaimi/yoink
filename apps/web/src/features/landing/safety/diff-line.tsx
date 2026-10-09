import type { CSSProperties } from "react";
import styles from "@/features/landing/safety/diff-line.module.css";
import type { DiffLine } from "@/features/landing/safety/settings-diff-model";
import { cn } from "@/shared/lib/cn";

export type DiffLineRowProps = {
  line: DiffLine;
  order: number;
};

const SIGNS: Readonly<Record<DiffLine["change"], string>> = { context: " ", added: "+", removed: "-" };

const INDENTS: readonly string[] = ["pl-0", "pl-5", "pl-10"];

const LineText = ({ line }: { line: DiffLine }): React.JSX.Element => {
  if (line.change === "added") return <ins className="no-underline">{line.text}</ins>;
  if (line.change === "removed") return <del className="text-muted decoration-danger">{line.text}</del>;
  return <span className={cn(line.ownedBy === "json" && "text-muted")}>{line.text}</span>;
};

const orderStyle = (order: number): CSSProperties => ({ "--order": order }) as CSSProperties;

export const DiffLineRow = ({ line, order }: DiffLineRowProps): React.JSX.Element => (
  <div
    style={orderStyle(order)}
    className={cn(
      "grid grid-cols-[1.75rem_1fr] pr-4",
      line.change !== "context" && styles.changed,
      line.change === "added" && "bg-success/10",
      line.change === "removed" && "bg-danger/10",
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        "text-center select-none text-faint",
        line.change === "added" && "text-success",
        line.change === "removed" && "text-danger",
      )}
    >
      {SIGNS[line.change]}
    </span>
    <span className={cn("whitespace-pre", INDENTS[line.depth])}>
      <LineText line={line} />
      {line.comma ? "," : null}
    </span>
  </div>
);
