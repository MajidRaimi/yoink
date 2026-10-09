import { describe, expect, test } from "bun:test";
import { brandedTitle, canonicalUrl, documentTitle, pageMetadata, verificationMetadata } from "./metadata";

describe("canonicalUrl", () => {
  test("adds a trailing slash and makes the url absolute", () => {
    expect(canonicalUrl("/reference")).toBe("https://yoink.codes/reference/");
    expect(canonicalUrl("/docs/providers/")).toBe("https://yoink.codes/docs/providers/");
    expect(canonicalUrl("/")).toBe("https://yoink.codes/");
  });

  test("drops a hash fragment", () => {
    expect(canonicalUrl("/#install")).toBe("https://yoink.codes/");
  });
});

describe("titles", () => {
  test("brand-qualifies a bare title with the CLI suffix", () => {
    expect(brandedTitle("Usage")).toBe("Usage · Yoink CLI");
  });

  test("never adds a second brand", () => {
    expect(brandedTitle("Download Yoink")).toBe("Download Yoink");
  });

  test("an explicit seo title wins over the branded label", () => {
    expect(documentTitle({ title: "Usage", seoTitle: "Yoink commands with examples" })).toBe("Yoink commands with examples");
    expect(documentTitle({ title: "Usage" })).toBe("Usage · Yoink CLI");
  });
});

describe("pageMetadata", () => {
  const metadata = pageMetadata({ title: "CLI reference", description: "Every command.", path: "/reference" });

  test("sets an absolute title so the layout template never appends a second brand", () => {
    expect(metadata.title).toEqual({ absolute: "CLI reference · Yoink CLI" });
  });

  test("sets the canonical, open graph and twitter tags from one input", () => {
    expect(metadata.description).toBe("Every command.");
    expect(metadata.alternates?.canonical).toBe("https://yoink.codes/reference/");
    expect(metadata.openGraph?.url).toBe("https://yoink.codes/reference/");
    expect(metadata.openGraph?.title).toBe("CLI reference · Yoink CLI");
    expect(metadata.openGraph?.siteName).toBe("Yoink for AI coding");
    expect(metadata.twitter?.title).toBe("CLI reference · Yoink CLI");
    expect(metadata.twitter?.description).toBe("Every command.");
  });

  test("the share title equals the document title", () => {
    const home = pageMetadata({ title: "Home", seoTitle: "Yoink, the AI coding account and provider switcher", description: "y", path: "/" });
    expect(home.title).toEqual({ absolute: "Yoink, the AI coding account and provider switcher" });
    expect(home.openGraph?.title).toBe("Yoink, the AI coding account and provider switcher");
    expect(home.twitter?.title).toBe("Yoink, the AI coding account and provider switcher");
  });

  test("leaves robots to the layout unless noIndex is set", () => {
    expect(metadata.robots).toBeUndefined();
    const hidden = pageMetadata({ title: "x", description: "y", path: "/x", noIndex: true });
    expect(hidden.robots).toEqual({ index: false, follow: true });
  });
});

describe("verificationMetadata", () => {
  test("emits nothing while both slots are empty", () => {
    expect(verificationMetadata({ google: "", bing: "" })).toBeUndefined();
  });

  test("maps google and bing tokens to their meta names", () => {
    expect(verificationMetadata({ google: "g-token", bing: "b-token" })).toEqual({
      google: "g-token",
      other: { "msvalidate.01": "b-token" },
    });
  });
});
