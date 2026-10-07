import { expect, test } from "bun:test";
import { applyProviderFieldEdit } from "../src/features/providers/field-edit";
import { kimiModel, makeProvider, visionModel } from "./support/provider-fixture";

const updatedAt = "2026-02-02T00:00:00.000Z";

test("applyProviderFieldEdit keeps every field the edit leaves out", () => {
  const current = makeProvider();
  const next = applyProviderFieldEdit(current, {}, updatedAt);
  expect(next).toEqual({ ...current, updatedAt });
});

test("applyProviderFieldEdit renames, retokens and points Claude Code at a new model", () => {
  const current = makeProvider({ connections: { "claude-code": { connectedAt: updatedAt, defaultModel: kimiModel.id } } });
  const next = applyProviderFieldEdit(
    current,
    { name: "fuse-two", displayName: "Fuse Two", token: "sk-new", model: visionModel.id, baseUrl: "https://api.fuse2.test/v1" },
    updatedAt,
  );
  expect(next.name).toBe("fuse-two");
  expect(next.provider).toBe("Fuse Two");
  expect(next.token).toBe("sk-new");
  expect(next.model).toBe(visionModel.id);
  expect(next.connections["claude-code"]?.defaultModel).toBe(visionModel.id);
  expect(next.baseUrl).toBe("https://api.fuse2.test");
  expect(next.endpoints.find((endpoint) => endpoint.protocol === "anthropic-messages")?.baseUrl).toBe("https://api.fuse2.test");
});

test("applyProviderFieldEdit adds an unknown model to the selection", () => {
  const next = applyProviderFieldEdit(makeProvider(), { model: "fresh/model" }, updatedAt);
  expect(next.models.map((model) => model.id)).toEqual([kimiModel.id, visionModel.id, "fresh/model"]);
  expect(next.model).toBe("fresh/model");
});
