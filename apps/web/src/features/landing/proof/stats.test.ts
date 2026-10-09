import { describe, expect, test } from "bun:test";
import {
  clauseSeparator,
  parseGithubStars,
  parseLatestCliTag,
  parseNpmDownloads,
  proofClauses,
} from "@/features/landing/proof/stats";

describe("proof stats parsing", () => {
  test("reads npm downloads and rejects malformed bodies", () => {
    expect(parseNpmDownloads({ downloads: 1234, package: "yoink-cli" })).toBe(1234);
    expect(parseNpmDownloads({ error: "package not found" })).toBeUndefined();
    expect(parseNpmDownloads({ downloads: -3 })).toBeUndefined();
    expect(parseNpmDownloads(null)).toBeUndefined();
  });

  test("reads GitHub stars", () => {
    expect(parseGithubStars({ stargazers_count: 0 })).toBe(0);
    expect(parseGithubStars({ message: "API rate limit exceeded" })).toBeUndefined();
  });

  test("picks the newest published CLI tag and skips desktop, draft and prerelease tags", () => {
    const releases = [
      { tag_name: "desktop-v0.1.6", draft: false, prerelease: false },
      { tag_name: "v0.7.0", draft: true, prerelease: false },
      { tag_name: "v0.6.6", draft: false, prerelease: true },
      { tag_name: "v0.6.5", draft: false, prerelease: false },
    ];
    expect(parseLatestCliTag(releases)).toBe("v0.6.5");
    expect(parseLatestCliTag({ message: "Not Found" })).toBeUndefined();
  });
});

describe("proof sentence", () => {
  test("omits every figure that failed to load", () => {
    expect(proofClauses({}).length).toBe(0);
    expect(proofClauses({ stars: 1 }).map((clause) => clause.after)).toEqual([" star on GitHub"]);
  });

  test("formats counts with grouping", () => {
    const [downloads] = proofClauses({ monthlyDownloads: 12345 });
    expect(downloads?.value).toBe("12,345");
  });

  test("joins two and three clauses as a sentence", () => {
    expect([0, 1].map((index) => clauseSeparator(index, 2))).toEqual([" and ", "."]);
    expect([0, 1, 2].map((index) => clauseSeparator(index, 3))).toEqual([", ", ", and ", "."]);
  });
});
