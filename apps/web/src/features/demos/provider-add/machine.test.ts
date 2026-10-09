import { describe, expect, test } from "bun:test";
import type { DemoEvent, DemoKey } from "@/shared/contract";
import { computeFinal, foldSteps, scriptDuration } from "@/features/demos/engine/frames";
import { FUSE_PROVIDER, HARNESS_CONFIG_PATHS, PRESET_MODELS } from "@/features/demos/data/fixtures";
import { HARNESSES } from "@/features/demos/data/harnesses.gen";
import { PROVIDER_PRESETS } from "@/features/demos/data/presets.gen";
import { providerAddDemo } from "@/features/demos/provider-add/definition";
import { harnessRows } from "@/features/demos/provider-add/harness-rows";
import {
  CANCELLED_MESSAGE,
  KEEP_DEFAULT_LABEL,
  NO_CHANGES_MESSAGE,
  REQUIRED_MESSAGE,
  SELECT_ONE_MESSAGE,
  STOPPED_MESSAGE,
  defaultOptions,
  defaultTargets,
  filteredModels,
  initial,
  isTextPhase,
  reduce,
  type State,
} from "@/features/demos/provider-add/machine";
import { eventsToPick, maskKey, rowWindow, statusText } from "@/features/demos/provider-add/selectors";
import { CUSTOM_PRESET, PRESET_OPTIONS, slugify, sourceFor } from "@/features/demos/provider-add/sources";

const key = (name: DemoKey): DemoEvent => ({ type: "key", key: name });
const text = (value: string): DemoEvent => ({ type: "text", value });
const run = (state: State, events: readonly DemoEvent[]): State => events.reduce(reduce, state);
const presetIndex = (id: string): number => PRESET_OPTIONS.findIndex((option) => option.id === id);
const moveTo = (index: number): DemoEvent[] => Array.from({ length: index }, () => key("down"));

const atKey = (presetId: string): State => run(initial, [...moveTo(presetIndex(presetId)), key("enter")]);
const atModels = (presetId: string): State => run(atKey(presetId), [text("sk-test"), key("enter")]);
const atHarnesses = (presetId: string): State => run(atModels(presetId), [key("space"), key("enter")]);
const OPENROUTER_MODELS = PRESET_MODELS.openrouter.models;

describe("sources", () => {
  test("preset options are every generated preset plus Custom", () => {
    expect(PRESET_OPTIONS.map((option) => option.id)).toEqual([...PROVIDER_PRESETS.map((preset) => preset.id), CUSTOM_PRESET]);
  });

  test("slugify matches the CLI profile id rule", () => {
    expect(slugify("Ollama (local)")).toBe("ollama-local");
    expect(slugify("***")).toBe("provider");
  });

  test("custom uses the Fuse fixture", () => {
    const source = sourceFor(CUSTOM_PRESET);
    expect(source.customBaseUrl).toBe(FUSE_PROVIDER.baseUrl);
    expect(source.models).toEqual(FUSE_PROVIDER.models);
  });
});

describe("preset phase", () => {
  test("arrows move and wrap", () => {
    expect(reduce(initial, key("down")).presetCursor).toBe(1);
    expect(reduce(initial, key("up")).presetCursor).toBe(PRESET_OPTIONS.length - 1);
  });

  test("other keys and text are ignored", () => {
    expect(reduce(initial, key("space"))).toBe(initial);
    expect(reduce(initial, text("x"))).toBe(initial);
  });

  test("enter picks the preset and opens the key prompt", () => {
    const state = atKey("openrouter");
    expect(state.phase).toBe("key");
    expect(state.source?.id).toBe("openrouter");
  });

  test("escape cancels", () => {
    const state = reduce(initial, key("escape"));
    expect(state.phase).toBe("cancelled");
    expect(state.message).toBe(CANCELLED_MESSAGE);
  });
});

describe("key phase", () => {
  test("text appends and backspace deletes", () => {
    const state = run(atKey("openai"), [text("abc"), text("d"), key("backspace")]);
    expect(state.key).toBe("abc");
    expect(maskKey(state.key)).toBe("•••");
    expect(isTextPhase(state)).toBe(true);
  });

  test("enter with an empty key shows the CLI validation message", () => {
    const state = reduce(atKey("openai"), key("enter"));
    expect(state.phase).toBe("key");
    expect(state.error).toBe(REQUIRED_MESSAGE);
    expect(reduce(state, text("a")).error).toBeNull();
  });

  test("enter with a key discovers endpoints and opens the model picker", () => {
    const state = atModels("openrouter");
    expect(state.phase).toBe("models");
    expect(state.source?.endpoints.map((endpoint) => endpoint.protocol)).toEqual(["openai-chat", "anthropic-messages"]);
  });

  test("escape cancels and arrows do nothing", () => {
    expect(reduce(atKey("openai"), key("down"))).toEqual(atKey("openai"));
    expect(reduce(atKey("openai"), key("escape")).phase).toBe("cancelled");
  });
});

describe("models phase", () => {
  test("space toggles the row under the cursor, as key or typed space", () => {
    const toggled = reduce(atModels("openrouter"), key("space"));
    expect(toggled.draftModels).toEqual([OPENROUTER_MODELS[0] ?? ""]);
    expect(reduce(toggled, text(" ")).draftModels).toEqual([]);
  });

  test("typing filters, resets the cursor and backspace widens again", () => {
    const moved = run(atModels("openrouter"), [key("down"), text("deep")]);
    expect(moved.modelCursor).toBe(0);
    expect(filteredModels(moved)).toEqual(["deepseek/deepseek-v4.1"]);
    expect(filteredModels(reduce(moved, key("backspace"))).length).toBeGreaterThanOrEqual(1);
    expect(filteredModels(run(moved, [key("backspace"), key("backspace"), key("backspace"), key("backspace")]))).toEqual(
      OPENROUTER_MODELS,
    );
  });

  test("toggled models keep the discovery order", () => {
    const state = run(atModels("openrouter"), [key("down"), key("space"), key("up"), key("space")]);
    expect(state.draftModels).toEqual(OPENROUTER_MODELS.slice(0, 2));
  });

  test("arrows wrap inside the filtered list and no match ignores space", () => {
    expect(reduce(atModels("openrouter"), key("up")).modelCursor).toBe(OPENROUTER_MODELS.length - 1);
    const none = run(atModels("openrouter"), [text("zzz"), key("space"), key("down")]);
    expect(none.draftModels).toEqual([]);
    expect(none.modelCursor).toBe(0);
  });

  test("enter requires at least one model", () => {
    const state = reduce(atModels("openrouter"), key("enter"));
    expect(state.phase).toBe("models");
    expect(state.error).toBe(SELECT_ONE_MESSAGE);
  });

  test("enter saves the models and opens the harness checklist on the first compatible row", () => {
    const ollama = atHarnesses("ollama");
    expect(ollama.phase).toBe("harnesses");
    expect(ollama.savedModels).toEqual(PRESET_MODELS.ollama.models.slice(0, 1));
    expect(harnessRows(ollama.source)[ollama.harnessCursor]?.reason).toBeNull();
    expect(HARNESSES[ollama.harnessCursor]?.id).toBe("pi");
  });

  test("escape cancels the add flow", () => {
    expect(reduce(atModels("openrouter"), key("escape")).message).toBe(CANCELLED_MESSAGE);
  });
});

describe("harness rows", () => {
  test("codex without a Responses endpoint gives the real reason", () => {
    const codex = harnessRows(sourceFor("openrouter")).find((row) => row.id === "codex");
    expect(codex?.reason).toBe("needs an OpenAI Responses endpoint");
  });

  test("other incompatible rows say no compatible endpoint", () => {
    const claude = harnessRows(sourceFor("ollama")).find((row) => row.id === "claude-code");
    expect(claude?.reason).toBe("no compatible endpoint");
  });

  test("compatible rows carry the real config path and experimental flag", () => {
    const rows = harnessRows(sourceFor("openai"));
    expect(rows.find((row) => row.id === "codex")?.reason).toBeNull();
    expect(rows.find((row) => row.id === "pi")?.path).toBe(HARNESS_CONFIG_PATHS.pi);
    expect(rows.filter((row) => row.experimental).map((row) => row.id)).toEqual(
      HARNESSES.filter((harness) => harness.experimental).map((harness) => harness.id),
    );
  });
});

describe("harness phase", () => {
  test("cursor skips disabled rows in both directions", () => {
    const opencode = run(atHarnesses("openrouter"), [key("down"), key("down"), key("down")]);
    expect(HARNESSES[opencode.harnessCursor]?.id).toBe("opencode");
    const qwen = reduce(opencode, key("down"));
    expect(HARNESSES[qwen.harnessCursor]?.id).toBe("qwen");
    expect(HARNESSES[reduce(qwen, key("up")).harnessCursor]?.id).toBe("opencode");
  });

  test("space toggles in harness order, typed space too", () => {
    const state = run(atHarnesses("openrouter"), [key("down"), key("space"), key("up"), text(" "), text("x")]);
    expect(state.checked).toEqual(["claude-code", "pi"]);
    expect(reduce(state, key("space")).checked).toEqual(["pi"]);
  });

  test("enter with nothing checked ends with no changes", () => {
    const state = reduce(atHarnesses("openrouter"), key("enter"));
    expect(state.phase).toBe("done");
    expect(state.outcome).toBe("unchanged");
    expect(statusText(state)).toBe(NO_CHANGES_MESSAGE);
  });

  test("escape cancels with no changes", () => {
    expect(reduce(atHarnesses("openrouter"), key("escape")).message).toBe(NO_CHANGES_MESSAGE);
  });
});

describe("default model phase", () => {
  const atDefault = (events: readonly DemoEvent[]): State => run(atHarnesses("openrouter"), [...events, key("enter")]);

  test("shared default offers keep current default", () => {
    const shared = atDefault([key("down"), key("space")]);
    expect(shared.phase).toBe("default");
    expect(defaultOptions(shared)[0]).toBe(KEEP_DEFAULT_LABEL);
  });

  test("Claude Code asks its own required default first, then the others with keep", () => {
    const claude = atDefault([key("space"), key("down"), key("space")]);
    expect(claude.phase).toBe("claudeDefault");
    expect(defaultTargets(claude)).toEqual(["claude-code"]);
    expect(defaultOptions(claude)).toEqual(claude.savedModels);
    const shared = reduce(claude, key("enter"));
    expect(shared.phase).toBe("default");
    expect(shared.claudeModel).toBe(claude.savedModels[0] ?? "");
    expect(defaultTargets(shared)).toEqual(["pi"]);
    expect(defaultOptions(shared)[0]).toBe(KEEP_DEFAULT_LABEL);
  });

  test("Claude Code alone connects after its default", () => {
    const done = reduce(atDefault([key("space")]), key("enter"));
    expect(done.phase).toBe("done");
    expect(done.connected).toEqual(["claude-code"]);
    expect(done.claudeModel).toBe(done.savedModels[0] ?? "");
  });

  test("harnesses that set no default model skip the prompt", () => {
    const droid = HARNESSES.findIndex((harness) => harness.id === "droid");
    const harnesses = atHarnesses("openrouter");
    const done = run(harnesses, [...eventsToPick(harnesses, droid), key("enter")]);
    expect(done.phase).toBe("done");
    expect(done.connected).toEqual(["droid"]);
    expect(done.defaultModel).toBeNull();
  });

  test("enter on keep connects without a default model", () => {
    const done = reduce(atDefault([key("down"), key("space")]), key("enter"));
    expect(done.phase).toBe("done");
    expect(done.connected).toEqual(["pi"]);
    expect(done.defaultModel).toBeNull();
    expect(done.outcome).toBe("connected");
  });

  test("arrows pick a model as default", () => {
    const done = run(atDefault([key("down"), key("space")]), [key("down"), key("enter")]);
    expect(done.defaultModel).toBe(done.savedModels[0] ?? "");
    expect(run(atDefault([key("down"), key("space")]), [key("up")]).defaultCursor).toBe(1);
  });

  test("escape stops before connecting and text is ignored", () => {
    const state = atDefault([key("down"), key("space")]);
    expect(reduce(state, text("a"))).toBe(state);
    expect(reduce(state, key("escape")).message).toBe(STOPPED_MESSAGE);
  });
});

describe("script", () => {
  const final = computeFinal(providerAddDemo);

  test("plays in under 15 seconds", () => {
    expect(scriptDuration(providerAddDemo.script)).toBeLessThan(15000);
  });

  test("ends on OpenRouter connected to pi, opencode and Qwen Code with three models", () => {
    expect(final.phase).toBe("done");
    expect(final.source?.id).toBe("openrouter");
    expect(final.savedModels).toHaveLength(3);
    expect(final.connected).toEqual(["pi", "opencode", "qwen"]);
    expect(final.outcome).toBe("connected");
    expect(final.key).not.toBe("");
    expect(statusText(final)).toContain("Connected pi, opencode, Qwen Code");
  });

  test("the key prompt sees typed text through the script", () => {
    const keyPhase = foldSteps(providerAddDemo, initial, providerAddDemo.script.slice(0, 7));
    expect(keyPhase.phase).toBe("key");
    expect(keyPhase.key).toBe("sk-or-v1-demo-key");
  });
});

describe("edit models after connecting", () => {
  const final = computeFinal(providerAddDemo);

  test("enter reopens the picker with the saved models", () => {
    const editing = reduce(final, key("enter"));
    expect(editing.phase).toBe("models");
    expect(editing.editing).toBe(true);
    expect(editing.draftModels).toEqual(final.savedModels);
    expect(reduce(final, key("down"))).toBe(final);
  });

  test("confirming re-syncs every connected harness again", () => {
    const resynced = run(final, [key("enter"), key("down"), key("down"), key("down"), key("space"), key("enter")]);
    expect(resynced.phase).toBe("done");
    expect(resynced.outcome).toBe("resynced");
    expect(resynced.connected).toEqual(final.connected);
    expect(resynced.savedModels).toHaveLength(4);
    expect(resynced.syncRound).toBe(final.syncRound + 1);
    expect(statusText(resynced)).toBe("Models saved. Re-synced pi, opencode, Qwen Code.");
  });

  test("escape leaves without changes", () => {
    const left = run(final, [key("enter"), key("space"), key("escape")]);
    expect(left.phase).toBe("done");
    expect(left.outcome).toBe("unchanged");
    expect(left.savedModels).toEqual(final.savedModels);
  });
});

describe("cancelled and reset", () => {
  test("enter starts over and other input is ignored", () => {
    const cancelled = reduce(initial, key("escape"));
    expect(reduce(cancelled, key("down"))).toBe(cancelled);
    expect(reduce(cancelled, key("enter"))).toBe(initial);
  });

  test("reset returns the initial state from anywhere", () => {
    expect(reduce(atHarnesses("openrouter"), { type: "reset" })).toBe(initial);
  });
});

describe("selectors", () => {
  test("rowWindow keeps the cursor visible", () => {
    expect(rowWindow(5, 3, 8)).toEqual({ start: 0, end: 5, above: 0, below: 0 });
    expect(rowWindow(13, 12, 8)).toEqual({ start: 5, end: 13, above: 5, below: 0 });
    expect(rowWindow(13, 6, 8)).toEqual({ start: 2, end: 10, above: 2, below: 3 });
  });

  test("eventsToPick moves to a row and activates it", () => {
    expect(run(initial, eventsToPick(initial, presetIndex("openrouter"))).source?.id).toBe("openrouter");
    const harnesses = atHarnesses("openrouter");
    const qwen = HARNESSES.findIndex((harness) => harness.id === "qwen");
    expect(run(harnesses, eventsToPick(harnesses, qwen)).checked).toEqual(["qwen"]);
  });

  test("eventsToPick on a disabled row does nothing", () => {
    const harnesses = atHarnesses("openrouter");
    const codex = HARNESSES.findIndex((harness) => harness.id === "codex");
    expect(eventsToPick(harnesses, codex)).toEqual([]);
  });

  test("statusText describes each phase", () => {
    expect(statusText(initial)).toContain(PRESET_OPTIONS[0]?.label ?? "");
    expect(statusText(atKey("openai"))).toContain("hidden");
    expect(statusText(atModels("openrouter"))).toBe(
      `${OPENROUTER_MODELS[0] ?? ""}, not selected. 0 of ${OPENROUTER_MODELS.length} models selected.`,
    );
    const harnesses = atHarnesses("openrouter");
    expect(statusText(harnesses)).toBe(`Claude Code, not selected, ${HARNESS_CONFIG_PATHS["claude-code"]}. 0 harnesses checked.`);
    expect(statusText(reduce(harnesses, key("space")))).toContain("Claude Code, selected");
    expect(statusText(reduce(harnesses, key("space")))).toContain("1 harness checked.");
    expect(statusText(reduce(initial, key("escape")))).toBe(CANCELLED_MESSAGE);
  });
});
