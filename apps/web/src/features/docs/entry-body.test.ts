import { describe, expect, test } from "bun:test";
import { alsoAtLine, composeEntryMarkdown, EntryBodyError, faqQuestions, splitEntryBody, wordCount } from "./entry-body";

const body = (lines: readonly string[]): string => lines.join("\n");

const valid = body([
  "# Title",
  "",
  alsoAtLine("/guides/x/"),
  "",
  "Lead paragraph with `code`.",
  "",
  "## Section",
  "",
  "Text.",
  "",
  "## FAQ",
  "",
  "### First question?",
  "",
  "First answer with [a link](../usage.md).",
  "",
  "### Second question?",
  "",
  "Second answer.",
]);

describe("splitEntryBody", () => {
  test("separates the lead from the rest and drops the Also at line", () => {
    const parts = splitEntryBody("docs/guides/x.md", valid, "/guides/x/");
    expect(parts.title).toBe("Title");
    expect(parts.leadMarkdown).toBe("Lead paragraph with `code`.");
    expect(parts.restMarkdown.startsWith("## Section")).toBe(true);
    expect(composeEntryMarkdown(parts, "## At a glance")).toStartWith("# Title\n\nLead paragraph with `code`.\n\n## At a glance\n\n## Section");
  });

  test("requires the h1, the exact Also at line and a lead paragraph", () => {
    expect(() => splitEntryBody("x", "Text first", "/guides/x/")).toThrow(EntryBodyError);
    expect(() => splitEntryBody("x", "# T\n\nAlso at yoink.codes/guides/x/\n\nLead", "/guides/x/")).toThrow(/Also at/);
    expect(() => splitEntryBody("x", `# T\n\n${alsoAtLine("/guides/y/")}\n\nLead`, "/guides/x/")).toThrow(/Also at/);
    expect(() => splitEntryBody("x", `# T\n\n${alsoAtLine("/guides/x/")}\n\n## Heading`, "/guides/x/")).toThrow(/lead/);
  });
});

describe("faqQuestions", () => {
  test("reads h3 questions and their answers from the FAQ section", () => {
    expect(faqQuestions(valid, "section")).toEqual([
      { id: "first-question", question: "First question?", answer: "First answer with a link." },
      { id: "second-question", question: "Second question?", answer: "Second answer." },
    ]);
  });

  test("page mode reads questions under every h2", () => {
    expect(faqQuestions("# F\n\n## A\n\n### One?\n\nYes.\n\n## B\n\n### Two?\n\nNo.", "page").map((item) => item.question)).toEqual([
      "One?",
      "Two?",
    ]);
  });

  test("a page without a FAQ section has no questions", () => {
    expect(faqQuestions("# T\n\n## Notes\n\n### Not a question\n\nText.", "section")).toEqual([]);
  });
});

describe("wordCount", () => {
  test("counts prose and skips fenced code", () => {
    expect(wordCount("Two words.\n\n```bash\nyoink add --external\n```\n\nThree more `words`.")).toBe(5);
  });
});
