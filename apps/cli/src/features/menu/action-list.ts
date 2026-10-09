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
  group?: string;
  enterLabel?: string;
};

type ListEntry = { kind: "header"; title: string } | { kind: "option"; option: ListOption; index: number };

export type ListResult =
  | { action: "switch"; name: string }
  | { action: "add" }
  | { action: "save" }
  | { action: "edit"; name: string }
  | { action: "delete"; name: string };

const BAR = pc.gray("│");
const BAR_START = pc.gray("┌");
const BAR_END = pc.gray("└");

const DEFAULT_ENTER_LABEL = "switch";
const EMPTY_LIST_ENTER_LABEL = "new";

export const enterLabelFor = (option: ListOption | undefined): string =>
  option === undefined ? EMPTY_LIST_ENTER_LABEL : (option.enterLabel ?? DEFAULT_ENTER_LABEL);

const helpLine = (enterLabel: string): string => {
  const key = (glyph: string) => theme.accent(glyph);
  const parts = [
    `${pc.dim("↑↓/jk")} ${pc.dim("move")}`,
    `${key("↵")} ${pc.dim(enterLabel)}`,
    `${key("n")} ${pc.dim("new")}`,
    `${key("e")} ${pc.dim("edit")}`,
    `${key("s")} ${pc.dim("save")}`,
    `${key("d")} ${pc.dim("delete")}`,
    `${key("q")} ${pc.dim("quit")}`,
  ];
  return parts.join(pc.dim("   "));
};

const toEntries = (options: ListOption[]): ListEntry[] =>
  options.flatMap((option, index): ListEntry[] => {
    const entry: ListEntry = { kind: "option", option, index };
    const startsGroup = option.group !== undefined && option.group !== options[index - 1]?.group;
    return startsGroup && option.group !== undefined ? [{ kind: "header", title: option.group }, entry] : [entry];
  });

const cursorEntryIndex = (entries: ListEntry[], cursor: number): number =>
  Math.max(0, entries.findIndex((entry) => entry.kind === "option" && entry.index === cursor));

const windowEntries = (entries: ListEntry[], cursor: number) => {
  const rows = process.stdout.rows || 24;
  const budget = Math.max(3, rows - 8);
  if (entries.length <= budget) {
    return { slice: entries, hasAbove: false, hasBelow: false };
  }
  const focus = cursorEntryIndex(entries, cursor);
  const start = Math.min(Math.max(0, focus - Math.floor(budget / 2)), entries.length - budget);
  return {
    slice: entries.slice(start, start + budget),
    hasAbove: start > 0,
    hasBelow: start + budget < entries.length,
  };
};

const renderEntry = (entry: ListEntry, cursor: number): string => {
  if (entry.kind === "header") return `${BAR}  ${pc.bold(entry.title)}`;
  const { option } = entry;
  const isCursor = entry.index === cursor;
  const radio = isCursor ? theme.accent("●") : pc.dim("○");
  const body = isCursor ? `${option.label} ${pc.dim(`(${option.hint})`)}` : pc.dim(option.label);
  return `${BAR}  ${radio} ${body}`;
};

const renderFrame = (self: ActionListPrompt): string => {
  if (self.state === "submit" || self.state === "cancel") return "";

  const lines = [`${BAR_START}  ${banner} ${pc.dim("switch accounts")}`, BAR];

  if (self.options.length === 0) {
    lines.push(
      `${BAR}  ${pc.dim("No profiles yet. Press ")}${theme.accent("n")}${pc.dim(" to add an account or ")}${theme.accent("s")}${pc.dim(" to save your current login.")}`,
    );
  } else {
    const { slice, hasAbove, hasBelow } = windowEntries(toEntries(self.options), self.cursor);
    if (hasAbove) lines.push(`${BAR}  ${pc.dim("↑ …")}`);
    for (const entry of slice) lines.push(renderEntry(entry, self.cursor));
    if (hasBelow) lines.push(`${BAR}  ${pc.dim("↓ …")}`);
  }

  lines.push(BAR, `${BAR_END}  ${helpLine(enterLabelFor(self.options[self.cursor]))}`);
  return lines.join("\n");
};

class ActionListPrompt extends Prompt<ListResult> {
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

export const actionList = async (opts: ActionListOptions): Promise<ListResult | symbol> => {
  const result = await new ActionListPrompt(opts).prompt();
  return result ?? { action: "add" };
};
