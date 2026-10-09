import { describe, expect, test } from "bun:test";
import type { DocMeta } from "@/shared/contract";
import { assertSectionsFollowOrder, assertUniqueOrder, DocFrontmatterError, MAX_SEO_TITLE_LENGTH, parseDocMeta, parseEntryMeta } from "./frontmatter";

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

describe("parseEntryMeta", () => {
  const facts = { harnessIds: new Set(["pi"]), presetIds: new Set(["openrouter"]) };
  const description = "d".repeat(150);
  const base = { title: "Use any provider in pi", description, nav: "pi", order: 1 };

  test("accepts a harness page and resolves related repo paths", () => {
    const meta = parseEntryMeta({ collection: "harnesses", slug: "pi" }, { ...base, harness: "pi", related: ["docs/how-it-works.md"] }, facts);
    expect(meta).toMatchObject({
      path: "/harnesses/pi/",
      repoPath: "docs/harnesses/pi.md",
      harness: "pi",
      related: [{ collection: "docs", slug: "how-it-works" }],
    });
  });

  test("checks the description length", () => {
    expect(() => parseEntryMeta({ collection: "guides", slug: "x" }, { ...base, description: "short" }, facts)).toThrow(/140 to 158/);
  });

  test("ties harness and preset ids to the file name and the generated facts", () => {
    expect(() => parseEntryMeta({ collection: "harnesses", slug: "pi" }, base, facts)).toThrow(/harness/);
    expect(() => parseEntryMeta({ collection: "harnesses", slug: "pi" }, { ...base, harness: "omp" }, facts)).toThrow(/file name/);
    expect(() => parseEntryMeta({ collection: "providers", slug: "zz" }, { ...base, preset: "zz" }, facts)).toThrow(/not one of/);
  });

  test("rejects related pages that do not exist or point at the page itself", () => {
    expect(() => parseEntryMeta({ collection: "guides", slug: "x" }, { ...base, related: ["docs/nope.md"] }, facts)).toThrow(/related/);
    expect(() =>
      parseEntryMeta({ collection: "harnesses", slug: "pi" }, { ...base, harness: "pi", related: ["docs/harnesses/pi.md"] }, facts),
    ).toThrow(/itself/);
  });

  test("a comparison carries exactly one dated source", () => {
    const competitor = { name: "claude-swap", url: "https://github.com/realiti4/claude-swap", version: "v1", checked: new Date("2026-10-10") };
    expect(parseEntryMeta({ collection: "compare", slug: "claude-swap" }, { ...base, competitor }, facts).competitor?.checked).toBe("2026-10-10");
    expect(parseEntryMeta({ collection: "compare", slug: "index" }, { ...base, checked: "2026-10-10" }, facts).checked).toBe("2026-10-10");
    expect(() => parseEntryMeta({ collection: "compare", slug: "index" }, { ...base, competitor }, facts)).toThrow(/roundup/);
    expect(() => parseEntryMeta({ collection: "compare", slug: "claude-swap" }, base, facts)).toThrow(/exactly one/);
    expect(() =>
      parseEntryMeta({ collection: "compare", slug: "claude-swap" }, { ...base, competitor: { ...competitor, url: "http://x" } }, facts),
    ).toThrow(/https/);
    expect(() => parseEntryMeta({ collection: "compare", slug: "index" }, { ...base, checked: "10/10/2026" }, facts)).toThrow(/ISO date/);
  });
});
