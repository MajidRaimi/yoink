import { expect, test } from "bun:test";
import { ConfigParseError, errorMessage, YoinkError } from "../src/shared/errors";
import { isRecord, readString, readTrimmedString } from "../src/shared/guards";
import { nowIso } from "../src/shared/time";
import { asRecord } from "../src/features/harnesses/adapters/config-values";

test("errorMessage prefers the error message, then the fallback, then the stringified value", () => {
  expect(errorMessage(new YoinkError("boom"), "fallback")).toBe("boom");
  expect(errorMessage("raw", "fallback")).toBe("fallback");
  expect(errorMessage("raw")).toBe("raw");
  expect(errorMessage(42)).toBe("42");
});

test("ConfigParseError reuses errorMessage for its cause", () => {
  expect(new ConfigParseError("/tmp/x.json", new Error("bad")).message).toBe("Could not parse /tmp/x.json: bad");
  expect(new ConfigParseError("/tmp/x.json", "oops").message).toBe("Could not parse /tmp/x.json: oops");
});

test("isRecord accepts plain objects only", () => {
  expect(isRecord({ a: 1 })).toBe(true);
  expect(isRecord([])).toBe(false);
  expect(isRecord(null)).toBe(false);
  expect(isRecord("x")).toBe(false);
  expect(asRecord([1])).toEqual({});
});

test("nowIso returns an ISO 8601 timestamp", () => {
  const value = nowIso();
  expect(new Date(value).toISOString()).toBe(value);
});

test("readString keeps non-empty strings as they are and drops everything else", () => {
  expect(readString(" model ")).toBe(" model ");
  expect(readString("")).toBeUndefined();
  expect(readString(42)).toBeUndefined();
  expect(readString(null)).toBeUndefined();
});

test("readTrimmedString trims strings and drops blank or non-string values", () => {
  expect(readTrimmedString("  token  ")).toBe("token");
  expect(readTrimmedString("   ")).toBeUndefined();
  expect(readTrimmedString(undefined)).toBeUndefined();
  expect(readTrimmedString(7)).toBeUndefined();
});
