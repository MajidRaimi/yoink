import { describe, expect, test } from "bun:test";
import type { DocMeta } from "@/shared/contract";
import { assertSectionsFollowOrder, assertUniqueOrder, DocFrontmatterError, MAX_SEO_TITLE_LENGTH, parseDocMeta } from "./frontmatter";

const valid = {
  title: "Providers",
  description: "Add a provider once.",
  nav: "Providers",
  order: 5,
  section: "Connect",
  demo: "provider-add",
};

const meta = (overrides: Partial<DocMeta>): DocMeta => ({
  slug: "providers",
  title: "t",
  description: "d",
  nav: "n",
  order: 1,
  section: "Start",
  ...overrides,
});

describe("parseDocMeta", () => {
  test("accepts complete frontmatter", () => {
    expect(parseDocMeta("providers", valid)).toEqual({ slug: "providers", ...valid, section: "Connect", demo: "provider-add" });
  });

  test("demo is optional", () => {
    const { demo: _demo, ...rest } = valid;
    expect(parseDocMeta("providers", rest).demo).toBeUndefined();
  });

  test.each(["title", "description", "nav", "order", "section"])("fails without %s", (field) => {
    const data: Record<string, unknown> = { ...valid };
    delete data[field];
    expect(() => parseDocMeta("providers", data)).toThrow(DocFrontmatterError);
  });

  test("seoTitle is optional, trimmed and capped at the title length limit", () => {
    expect(parseDocMeta("providers", valid).seoTitle).toBeUndefined();
    expect(parseDocMeta("providers", { ...valid, seoTitle: "  Connect providers · Yoink CLI " }).seoTitle).toBe(
      "Connect providers · Yoink CLI",
    );
    expect(() => parseDocMeta("providers", { ...valid, seoTitle: "" })).toThrow(/seoTitle/);
    expect(() => parseDocMeta("providers", { ...valid, seoTitle: "x".repeat(MAX_SEO_TITLE_LENGTH + 1) })).toThrow(/at most/);
  });

  test("rejects an unknown section, demo, or a non-integer order", () => {
    expect(() => parseDocMeta("providers", { ...valid, section: "Misc" })).toThrow(/section/);
    expect(() => parseDocMeta("providers", { ...valid, demo: "nope" })).toThrow(/demo/);
    expect(() => parseDocMeta("providers", { ...valid, order: 1.5 })).toThrow(/order/);
    expect(() => parseDocMeta("providers", { ...valid, title: "  " })).toThrow(/title/);
  });
});

describe("ordering", () => {
  test("rejects duplicate order", () => {
    expect(() => assertUniqueOrder([meta({ slug: "usage", order: 2 }), meta({ slug: "desktop", order: 2 })])).toThrow(/already used/);
  });

  test("rejects a section that goes backwards in nav order", () => {
    expect(() =>
      assertSectionsFollowOrder([meta({ slug: "usage", order: 1, section: "Reference" }), meta({ slug: "desktop", order: 2, section: "Start" })]),
    ).toThrow(/nav order/);
  });
});
