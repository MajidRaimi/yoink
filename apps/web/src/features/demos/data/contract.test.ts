import { describe, expect, test } from "bun:test";
import { PROFILE_GROUP_KEYS, PROTOCOLS, type Protocol } from "@/shared/contract";
import { PROFILE_GROUP_TITLES } from "@/features/demos/data/groups.gen";
import { HARNESSES } from "@/features/demos/data/harnesses.gen";
import { PROVIDER_PRESETS } from "@/features/demos/data/presets.gen";

const knownProtocols: ReadonlySet<string> = new Set<Protocol>(PROTOCOLS);

describe("generated data matches the hand-written contract", () => {
  test("profile group keys match the CLI group titles", () => {
    expect(Object.keys(PROFILE_GROUP_TITLES)).toEqual([...PROFILE_GROUP_KEYS]);
  });

  test("every harness protocol is a known protocol", () => {
    const harnessProtocols = HARNESSES.flatMap((harness) => [...harness.protocols]);
    expect(harnessProtocols.filter((protocol) => !knownProtocols.has(protocol))).toEqual([]);
  });

  test("every preset endpoint protocol is a known protocol", () => {
    const presetProtocols = PROVIDER_PRESETS.flatMap((preset) => preset.endpoints.map((endpoint) => endpoint.protocol));
    expect(presetProtocols.filter((protocol) => !knownProtocols.has(protocol))).toEqual([]);
  });
});
