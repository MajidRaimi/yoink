import { describe, expect, test } from "bun:test";
import { breadcrumbLd, serializeJsonLd, softwareApplicationLd, techArticleLd, webSiteLd } from "./json-ld";

describe("json-ld builders", () => {
  test("software application points at the canonical site and is free", () => {
    const data = softwareApplicationLd();
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.url).toBe("https://yoink.codes/");
    expect(data.isAccessibleForFree).toBe(true);
    expect(data.downloadUrl).toBe("https://yoink.codes/download/");
    expect(data.installUrl).toBe("https://yoink.codes/#install");
    expect(data.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "USD" });
    expect(data).not.toHaveProperty("aggregateRating");
  });

  test("web site and tech article use trailing slash urls", () => {
    expect(webSiteLd().url).toBe("https://yoink.codes/");
    const article = techArticleLd({ title: "Usage", description: "Commands.", path: "/docs/usage" });
    expect(article.url).toBe("https://yoink.codes/docs/usage/");
    expect(article.headline).toBe("Usage");
  });

  test("breadcrumbs are numbered from one", () => {
    const data = breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Docs", path: "/docs" },
    ]);
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://yoink.codes/" },
      { "@type": "ListItem", position: 2, name: "Docs", item: "https://yoink.codes/docs/" },
    ]);
  });

  test("serialization cannot close the script element", () => {
    const html = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(html).not.toContain("<");
    expect(JSON.parse(html)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
