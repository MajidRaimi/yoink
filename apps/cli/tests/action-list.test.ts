import { PassThrough, Writable } from "node:stream";
import { expect, test } from "bun:test";
import { isCancel } from "@clack/core";
import { actionList, type ListOption, type ListResult } from "../src/features/menu/action-list";

const sink = (): Writable =>
  new Writable({
    write(_chunk, _enc, cb) {
      cb();
    },
  });

type Emit = { str: string; key: Record<string, unknown> };

const K = {
  down: { str: "", key: { name: "down" } } as Emit,
  up: { str: "", key: { name: "up" } } as Emit,
  enter: { str: "", key: { name: "return" } } as Emit,
  ctrlc: { str: "\x03", key: { name: "c", ctrl: true, sequence: "\x03" } } as Emit,
  ch: (c: string): Emit => ({ str: c, key: { name: c } }),
};

const OPTIONS: ListOption[] = [
  { name: "example", label: "example", hint: "user@example.com", isCurrent: true },
  { name: "personal", label: "personal", hint: "personal@example.com", isCurrent: false },
  { name: "glm", label: "glm", hint: "OpenRouter · z-ai/glm-5.2", isCurrent: false },
];

const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

const drive = async (
  options: ListOption[],
  keys: Emit[],
  initialName?: string,
): Promise<ListResult | symbol> => {
  const input = new PassThrough();
  (input as unknown as { isTTY: boolean }).isTTY = false;
  const promise = actionList({ options, initialName, input, output: sink() });
  for (const k of keys) input.emit("keypress", k.str, k.key);
  return withTimeout(promise, 3000);
};

const asResult = (r: ListResult | symbol): ListResult => r as ListResult;

test("down,down,enter switches to glm", async () => {
  const r = await drive(OPTIONS, [K.down, K.down, K.enter], "example");
  expect(isCancel(r)).toBe(false);
  expect(asResult(r)).toEqual({ action: "switch", name: "glm" });
});

test("n adds", async () => {
  const r = await drive(OPTIONS, [K.ch("n")], "example");
  expect(asResult(r).action).toBe("add");
});

test("s saves", async () => {
  const r = await drive(OPTIONS, [K.ch("s")], "example");
  expect(asResult(r).action).toBe("save");
});

test("d deletes the cursor row", async () => {
  const r = await drive(OPTIONS, [K.ch("d")], "example");
  expect(asResult(r)).toEqual({ action: "delete", name: "example" });
});

test("down then d deletes personal", async () => {
  const r = await drive(OPTIONS, [K.down, K.ch("d")], "example");
  expect(asResult(r)).toEqual({ action: "delete", name: "personal" });
});

test("q cancels", async () => {
  const r = await drive(OPTIONS, [K.ch("q")], "example");
  expect(typeof r).toBe("symbol");
});

test("ctrl-c cancels", async () => {
  const r = await drive(OPTIONS, [K.ctrlc], "example");
  expect(typeof r).toBe("symbol");
});

test("empty list + enter adds", async () => {
  const r = await drive([], [K.enter]);
  expect(asResult(r).action).toBe("add");
});

test("empty list ignores d, then n adds", async () => {
  const r = await drive([], [K.ch("d"), K.ch("n")]);
  expect(asResult(r).action).toBe("add");
});

test("up wraps to glm", async () => {
  const r = await drive(OPTIONS, [K.up, K.enter], "example");
  expect(asResult(r)).toEqual({ action: "switch", name: "glm" });
});

test("enter on initial=personal switches personal", async () => {
  const r = await drive(OPTIONS, [K.enter], "personal");
  expect(asResult(r)).toEqual({ action: "switch", name: "personal" });
});

test("e edits the cursor row", async () => {
  const r = await drive(OPTIONS, [K.ch("e")], "example");
  expect(asResult(r)).toEqual({ action: "edit", name: "example" });
});

test("down then e edits personal", async () => {
  const r = await drive(OPTIONS, [K.down, K.ch("e")], "example");
  expect(asResult(r)).toEqual({ action: "edit", name: "personal" });
});

test("empty list ignores e, then n adds", async () => {
  const r = await drive([], [K.ch("e"), K.ch("n")]);
  expect(asResult(r).action).toBe("add");
});

const GROUPED: ListOption[] = [
  { name: "work", label: "work", hint: "work@example.com", isCurrent: true, group: "Claude Code" },
  { name: "cx-a", label: "cx-a", hint: "a@example.com", isCurrent: false, group: "ChatGPT (Codex)" },
  { name: "cx-b", label: "cx-b", hint: "b@example.com", isCurrent: true, group: "ChatGPT (Codex)" },
];

const capture = (): { stream: Writable; text: () => string } => {
  const chunks: string[] = [];
  return {
    stream: new Writable({
      write(chunk, _enc, cb) {
        chunks.push(String(chunk));
        cb();
      },
    }),
    text: () => Bun.stripANSI(chunks.join("")),
  };
};

test("grouped rows skip section headers when moving", async () => {
  const r = await drive(GROUPED, [K.down, K.enter], "work");
  expect(asResult(r)).toEqual({ action: "switch", name: "cx-a" });
});

test("grouped rows render one header per tool", async () => {
  const input = new PassThrough();
  (input as unknown as { isTTY: boolean }).isTTY = false;
  const output = capture();
  const promise = actionList({ options: GROUPED, initialName: "work", input, output: output.stream });
  input.emit("keypress", "q", { name: "q" });
  await withTimeout(promise, 3000);
  const text = output.text();
  expect(text).toContain("Claude Code");
  expect(text.split("ChatGPT (Codex)").length - 1).toBe(1);
});
