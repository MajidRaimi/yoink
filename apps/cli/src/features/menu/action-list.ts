import type { Readable, Writable } from "node:stream";
import { Prompt } from "@clack/core";
import pc from "picocolors";
import { theme } from "../../shared/theme";
import { banner } from "./banner";

type ActionListOptions = {
  options: ListOption[];
  initialName?: string;
  input?: Readable;
  output?: Writable;
};

export type ListOption = {
  name: string;
  label: string;
  hint: string;
  isCurrent: boolean;
};

export type ListResult =
  | { action: "switch"; name: string }
  | { action: "add" }
  | { action: "save" }
  | { action: "edit"; name: string }
  | { action: "delete"; name: string };

const BAR = pc.gray("│");
const BAR_START = pc.gray("┌");
const BAR_END = pc.gray("└");

const helpLine = (): string => {
  const key = (glyph: string) => theme.accent(glyph);
  const parts = [
    `${pc.dim("↑↓/jk")} ${pc.dim("move")}`,
    `${key("↵")} ${pc.dim("switch")}`,
    `${key("n")} ${pc.dim("new")}`,
    `${key("e")} ${pc.dim("edit")}`,
    `${key("s")} ${pc.dim("save")}`,
    `${key("d")} ${pc.dim("delete")}`,
    `${key("q")} ${pc.dim("quit")}`,
  ];
  return parts.join(pc.dim("   "));
};

const windowOptions = (options: ListOption[], cursor: number) => {
  const rows = process.stdout.rows || 24;
  const budget = Math.max(3, rows - 8);
  if (options.length <= budget) {
    return { slice: options, start: 0, hasAbove: false, hasBelow: false };
  }
  const start = Math.min(Math.max(0, cursor - Math.floor(budget / 2)), options.length - budget);
  return {
    slice: options.slice(start, start + budget),
    start,
    hasAbove: start > 0,
    hasBelow: start + budget < options.length,
  };
};

const renderFrame = (self: ActionListPrompt): string => {
  if (self.state === "submit" || self.state === "cancel") return "";

  const lines = [`${BAR_START}  ${banner} ${pc.dim("switch Claude accounts")}`, BAR];

  if (self.options.length === 0) {
    lines.push(
      `${BAR}  ${pc.dim("No profiles yet. Press ")}${theme.accent("n")}${pc.dim(" to add an account or ")}${theme.accent("s")}${pc.dim(" to save your current login.")}`,
    );
  } else {
    const { slice, start, hasAbove, hasBelow } = windowOptions(self.options, self.cursor);
    if (hasAbove) lines.push(`${BAR}  ${pc.dim("↑ …")}`);
    slice.forEach((option, index) => {
      const isCursor = start + index === self.cursor;
      const radio = isCursor ? theme.accent("●") : pc.dim("○");
      const body = isCursor ? `${option.label} ${pc.dim(`(${option.hint})`)}` : pc.dim(option.label);
      lines.push(`${BAR}  ${radio} ${body}`);
    });
    if (hasBelow) lines.push(`${BAR}  ${pc.dim("↓ …")}`);
  }

  lines.push(BAR, `${BAR_END}  ${helpLine()}`);
  return lines.join("\n");
};

class ActionListPrompt extends Prompt {
  options: ListOption[];
  cursor: number;

  constructor(opts: ActionListOptions) {
    super(
      {
        render() {
          return renderFrame(this as unknown as ActionListPrompt);
        },
        input: opts.input,
        output: opts.output,
      },
      false,
    );

    this.options = opts.options;
    const initialIndex = opts.initialName
      ? this.options.findIndex((option) => option.name === opts.initialName)
      : 0;
    this.cursor = initialIndex >= 0 ? initialIndex : 0;
    this.value = this.highlighted();

    this.on("cursor", (action) => {
      if (this.options.length === 0) return;
      if (action === "up") this.cursor = (this.cursor - 1 + this.options.length) % this.options.length;
      else if (action === "down") this.cursor = (this.cursor + 1) % this.options.length;
      this.value = this.highlighted();
    });

    this.on("key", (char) => {
      switch (char) {
        case "n":
          this.value = { action: "add" };
          this.state = "submit";
          break;
        case "s":
          this.value = { action: "save" };
          this.state = "submit";
          break;
        case "e": {
          const target = this.options[this.cursor];
          if (target) {
            this.value = { action: "edit", name: target.name };
            this.state = "submit";
          }
          break;
        }
        case "d": {
          const target = this.options[this.cursor];
          if (target) {
            this.value = { action: "delete", name: target.name };
            this.state = "submit";
          }
          break;
        }
        case "q":
          this.state = "cancel";
          break;
      }
    });
  }

  private highlighted(): ListResult {
    const target = this.options[this.cursor];
    if (!target) return { action: "add" };
    return { action: "switch", name: target.name };
  }
}

export const actionList = async (opts: ActionListOptions): Promise<ListResult | symbol> =>
  (await new ActionListPrompt(opts).prompt()) as ListResult | symbol;
