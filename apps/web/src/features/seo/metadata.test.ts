import { describe, expect, test } from "bun:test";
import { canonicalUrl, pageMetadata } from "./metadata";

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

describe("pageMetadata", () => {
  const metadata = pageMetadata({ title: "CLI reference", description: "Every command.", path: "/reference" });

  test("sets the canonical, open graph and twitter tags from one input", () => {
    expect(metadata.title).toBe("CLI reference");
    expect(metadata.description).toBe("Every command.");
    expect(metadata.alternates?.canonical).toBe("https://yoink.codes/reference/");
    expect(metadata.openGraph?.url).toBe("https://yoink.codes/reference/");
    expect(metadata.openGraph?.title).toBe("CLI reference");
    expect(metadata.twitter?.title).toBe("CLI reference");
    expect(metadata.twitter?.description).toBe("Every command.");
  });

  test("leaves robots to the layout unless noIndex is set", () => {
    expect(metadata.robots).toBeUndefined();
    const hidden = pageMetadata({ title: "x", description: "y", path: "/x", noIndex: true });
    expect(hidden.robots).toEqual({ index: false, follow: true });
  });
});
