import { expect, test } from "bun:test";
import { splitModelSelection } from "../src/features/providers/model-selection";
import { kimiModel, visionModel } from "./support/provider-fixture";

test("splitModelSelection keeps known specs and lists only new ids for lookup", () => {
  expect(splitModelSelection([kimiModel, visionModel], ["new/model", kimiModel.id])).toEqual({
    kept: [kimiModel],
    missing: [{ id: "new/model", name: "new/model" }],
  });
});

test("splitModelSelection ignores repeated ids", () => {
  expect(splitModelSelection([], ["a", "a"]).missing).toEqual([{ id: "a", name: "a" }]);
});
