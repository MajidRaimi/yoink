import { expect, test } from "bun:test";
import { readModelInputs, toModelSpec } from "../src/features/harnesses/adapters/model-mapping";
import { mergeModels } from "../src/features/harnesses/import";
import { MODEL_SPEC_DEFAULTS, defaultModelSpec } from "../src/features/profiles/model-spec";

test("toModelSpec fills missing fields from the shared model spec defaults", () => {
  expect(toModelSpec({ id: "kimi-k2" })).toEqual(defaultModelSpec("kimi-k2"));
});

test("toModelSpec falls back to the shared defaults when harness values are malformed", () => {
  const spec = toModelSpec({ id: "kimi-k2", name: 7, contextWindow: "big", maxOutput: null, reasoning: "yes", input: [] });
  expect(spec).toEqual(defaultModelSpec("kimi-k2"));
});

test("toModelSpec keeps explicit harness values over the defaults", () => {
  const spec = toModelSpec({
    id: "kimi-k2",
    name: "Kimi K2",
    contextWindow: 256000,
    maxOutput: 16000,
    reasoning: true,
    input: ["text", "image", "audio"],
  });
  expect(spec).toEqual({
    id: "kimi-k2",
    name: "Kimi K2",
    contextWindow: 256000,
    maxOutput: 16000,
    reasoning: true,
    input: ["text", "image"],
  });
});

test("readModelInputs returns a fresh copy of the default inputs", () => {
  const inputs = readModelInputs(undefined);
  expect(inputs).toEqual([...MODEL_SPEC_DEFAULTS.input]);
  inputs.push("image");
  expect(readModelInputs("text")).toEqual([...MODEL_SPEC_DEFAULTS.input]);
  expect(MODEL_SPEC_DEFAULTS.input).toEqual(["text"]);
});

test("mergeModels treats the shared defaults as unset when another harness has explicit limits", () => {
  const imported = toModelSpec({ id: "kimi-k2" });
  const explicit = toModelSpec({ id: "kimi-k2", contextWindow: 256000, maxOutput: 16000 });
  const [merged] = mergeModels([imported], [explicit]);
  expect(merged?.contextWindow).toBe(256000);
  expect(merged?.maxOutput).toBe(16000);
});
