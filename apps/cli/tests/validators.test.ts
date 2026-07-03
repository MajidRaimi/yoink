import { expect, test } from "bun:test";
import { requireNonEmpty, validateHttpUrl } from "../src/shared/validators";

test("validateHttpUrl accepts http and https", () => {
  expect(validateHttpUrl("https://openrouter.ai/api")).toBeUndefined();
  expect(validateHttpUrl("http://localhost:8080")).toBeUndefined();
  expect(validateHttpUrl("  https://trimmed.example  ")).toBeUndefined();
});

test("validateHttpUrl rejects non-http", () => {
  expect(validateHttpUrl("openrouter.ai")).toBe("Must start with http:// or https://");
  expect(validateHttpUrl("ftp://example.com")).toBe("Must start with http:// or https://");
  expect(validateHttpUrl("")).toBe("Must start with http:// or https://");
});

test("requireNonEmpty rejects blank and whitespace", () => {
  expect(requireNonEmpty("")).toBe("This field is required");
  expect(requireNonEmpty("   ")).toBe("This field is required");
});

test("requireNonEmpty accepts real values", () => {
  expect(requireNonEmpty("x")).toBeUndefined();
});
