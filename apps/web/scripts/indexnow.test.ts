import { describe, expect, test } from "bun:test";
import {
  BATCH_SIZE,
  KEY_WAIT_BUDGET_MS,
  backoffDelays,
  buildPayloads,
  describeStatus,
  findKey,
  parseSitemap,
  selectUrls,
  waitForKey,
} from "./indexnow";

const KEY = "abd074e3038adc84064e5b80170fefd1";

const sitemapXml = (entries: readonly (readonly [string, string | null])[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      ([loc, lastmod]) => `<url>\n<loc>${loc}</loc>${lastmod ? `\n<lastmod>${lastmod}</lastmod>` : ""}\n</url>`,
    ),
    "</urlset>",
  ].join("\n");

const previous = parseSitemap(
  sitemapXml([
    ["https://yoink.codes/", "2026-10-01T10:00:00.000Z"],
    ["https://yoink.codes/docs/", "2026-10-01T10:00:00.000Z"],
    ["https://yoink.codes/download/", "2026-10-01T10:00:00.000Z"],
  ]),
);

const current = parseSitemap(
  sitemapXml([
    ["https://yoink.codes/", "2026-10-01T10:00:00.000Z"],
    ["https://yoink.codes/docs/", "2026-10-09T18:30:00.000Z"],
    ["https://yoink.codes/download/", "2026-10-01T10:00:00.000Z"],
    ["https://yoink.codes/docs/harnesses/", "2026-10-09T18:30:00.000Z"],
  ]),
);

describe("parseSitemap", () => {
  test("reads loc and lastmod and decodes entities", () => {
    const entries = parseSitemap(
      sitemapXml([
        ["https://yoink.codes/a/?x=1&amp;y=2", "2026-10-09"],
        ["https://yoink.codes/b/", null],
      ]),
    );
    expect(entries).toEqual([
      { loc: "https://yoink.codes/a/?x=1&y=2", lastmod: "2026-10-09" },
      { loc: "https://yoink.codes/b/", lastmod: null },
    ]);
  });

  test("returns nothing for markup that is not a sitemap", () => {
    expect(parseSitemap("<html><body>Not found</body></html>")).toEqual([]);
  });
});

describe("selectUrls", () => {
  test("submits only new URLs and URLs whose lastmod changed", () => {
    expect(selectUrls(current, previous, false)).toEqual([
      "https://yoink.codes/docs/",
      "https://yoink.codes/docs/harnesses/",
    ]);
  });

  test("submits every URL with --all", () => {
    expect(selectUrls(current, previous, true)).toHaveLength(4);
  });

  test("submits every URL when there is no previous sitemap", () => {
    expect(selectUrls(current, null, false)).toHaveLength(4);
  });

  test("submits nothing when the sitemap is unchanged", () => {
    expect(selectUrls(previous, previous, false)).toEqual([]);
  });

  test("treats a newly added lastmod as a change", () => {
    const withoutDates = parseSitemap(sitemapXml([["https://yoink.codes/", null]]));
    const withDates = parseSitemap(sitemapXml([["https://yoink.codes/", "2026-10-09"]]));
    expect(selectUrls(withDates, withoutDates, false)).toEqual(["https://yoink.codes/"]);
    expect(selectUrls(withoutDates, withoutDates, false)).toEqual([]);
  });

  test("drops URLs on other hosts or schemes and duplicates", () => {
    const mixed = parseSitemap(
      sitemapXml([
        ["https://yoink.codes/", null],
        ["https://yoink.codes/", null],
        ["http://yoink.codes/docs/", null],
        ["https://www.yoink.codes/docs/", null],
        ["https://example.com/", null],
      ]),
    );
    expect(selectUrls(mixed, null, true)).toEqual(["https://yoink.codes/"]);
  });
});

describe("buildPayloads", () => {
  test("builds the IndexNow body with host, key and keyLocation", () => {
    expect(buildPayloads(KEY, ["https://yoink.codes/"])).toEqual([
      {
        host: "yoink.codes",
        key: KEY,
        keyLocation: `https://yoink.codes/${KEY}.txt`,
        urlList: ["https://yoink.codes/"],
      },
    ]);
  });

  test("splits into batches of at most 10000 URLs", () => {
    const urls = Array.from({ length: BATCH_SIZE * 2 + 5 }, (_, index) => `https://yoink.codes/p${index}/`);
    const payloads = buildPayloads(KEY, urls);
    expect(payloads.map((payload) => payload.urlList.length)).toEqual([BATCH_SIZE, BATCH_SIZE, 5]);
    expect(payloads.flatMap((payload) => payload.urlList)).toEqual(urls);
  });

  test("builds nothing for an empty list", () => {
    expect(buildPayloads(KEY, [])).toEqual([]);
  });
});

describe("findKey", () => {
  const bodies: Record<string, string> = {
    "CNAME": "yoink.codes",
    "notes.txt": "hello",
    "deadbeef00.txt": "something else",
    [`${KEY}.txt`]: KEY,
  };
  const read = (name: string): string => bodies[name] ?? "";

  test("finds the hex key file whose body equals its name", () => {
    expect(findKey(Object.keys(bodies), read)).toBe(KEY);
  });

  test("returns null when no file qualifies", () => {
    expect(findKey(["CNAME", "notes.txt", "deadbeef00.txt"], read)).toBeNull();
  });
});

describe("backoffDelays", () => {
  test("doubles up to a minute and stays within the budget", () => {
    const delays = backoffDelays(KEY_WAIT_BUDGET_MS);
    expect(delays.slice(0, 5)).toEqual([5_000, 10_000, 20_000, 40_000, 60_000]);
    expect(delays.reduce((sum, delay) => sum + delay, 0)).toBeLessThanOrEqual(KEY_WAIT_BUDGET_MS);
    expect(Math.max(...delays)).toBe(60_000);
  });
});

describe("waitForKey", () => {
  test("polls until the key file returns the key", async () => {
    const responses = [null, "<html>404</html>", `${KEY}\n`];
    const slept: number[] = [];
    const live = await waitForKey(KEY, {
      fetchText: async () => responses.shift() ?? null,
      sleep: async (ms) => {
        slept.push(ms);
      },
    });
    expect(live).toBe(true);
    expect(slept).toEqual([5_000, 10_000]);
  });

  test("gives up after the budget", async () => {
    let calls = 0;
    const live = await waitForKey(
      KEY,
      {
        fetchText: async () => {
          calls += 1;
          return null;
        },
        sleep: async () => undefined,
      },
      20_000,
    );
    expect(live).toBe(false);
    expect(calls).toBe(3);
  });
});

describe("describeStatus", () => {
  test("names known IndexNow responses", () => {
    expect(describeStatus(202)).toBe("URLs received, key validation pending");
    expect(describeStatus(500)).toBe("unexpected response");
  });
});
