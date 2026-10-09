import { describe, expect, test } from "bun:test";
import { serializeJsonLd, softwareApplicationJsonLd } from "@/features/landing/seo/software-application";

describe("SoftwareApplication JSON-LD", () => {
  test("uses canonical trailing-slash URLs", () => {
    const data = softwareApplicationJsonLd("desc");
    expect(data.url).toBe("https://yoink.codes/");
    expect(data.downloadUrl).toBe("https://yoink.codes/download/");
    expect(data.installUrl).toBe("https://yoink.codes/#install");
  });

  test("escapes markup when serialized", () => {
    expect(serializeJsonLd({ name: "</script>" })).not.toContain("</script>");
  });
});
