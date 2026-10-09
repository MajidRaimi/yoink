import { describe, expect, test } from "bun:test";
import { allEntryRefs, entryUrlPath } from "@/features/docs/collections";
import { getDocs, getEntries } from "@/features/docs/content";
import { headingIdsFor } from "@/features/docs/headings";
import type { DocLinkContext } from "@/features/docs/mdx/remark-doc-links";
import { HARNESS_FACTS, HARNESSES, PROVIDER_PRESETS } from "@/features/demos/data";
import {
  HARNESS_TABLE_ANCHOR,
  LLMS_SUMMARY,
  PRESET_TABLE_ANCHOR,
  absolutizeDocMarkdown,
  harnessLinks,
  llmsFull,
  llmsIndex,
  markdownTwinUrl,
  markdownTwins,
  presetLinks,
  reachableHarnesses,
  renderLlmsDocument,
  renderLlmsIndex,
} from "./llms";

const PAGE_URL = "https://yoink.codes/docs/providers/";

const testContext: DocLinkContext = {
  source: { collection: "docs", slug: "providers" },
  sourceRepoPath: "docs/providers.md",
  resolveEntry: (repoPath) => {
    const slug = /^docs\/([a-z-]+)\.md$/.exec(repoPath)?.[1];
    return slug === "harnesses" || slug === "usage" ? { collection: "docs", slug } : null;
  },
  headingIds: () => new Set(["presets", "supported-harnesses"]),
  repoFileExists: (repoPath) => repoPath === "docs/assets/banner.png",
};

const reachById = (): Record<string, number> =>
  Object.fromEntries(PROVIDER_PRESETS.map((preset) => [preset.id, reachableHarnesses(preset, HARNESSES).length]));

describe("renderLlmsIndex", () => {
  test("renders the H1, blockquote summary, details and linked sections", () => {
    const output = renderLlmsIndex({
      name: "Yoink",
      summary: "Summary.",
      details: ["Install: `x`."],
      sections: [
        { title: "Docs", links: [{ title: "Usage", url: "https://a/usage/", description: "Commands.", markdownUrl: "https://a/usage/index.md" }] },
        { title: "Guides", links: [] },
      ],
    });
    expect(output).toBe(
      "# Yoink\n\n> Summary.\n\nInstall: `x`.\n\n## Docs\n\n- [Usage](https://a/usage/): Commands. Markdown: https://a/usage/index.md\n",
    );
  });
});

describe("renderLlmsDocument", () => {
  test("puts the title and source URL above the body", () => {
    expect(renderLlmsDocument({ title: "Usage", url: "https://a/usage/", markdown: "\nBody.\n\n" })).toBe(
      "# Usage\n\nSource: https://a/usage/\n\nBody.\n",
    );
  });
});

describe("absolutizeDocMarkdown", () => {
  test("drops the leading H1 and absolutizes doc, anchor and image links", () => {
    const body = [
      "# Providers",
      "",
      "See [Harnesses](./harnesses.md#supported-harnesses), [presets](#presets) and [models.dev](https://models.dev).",
      "",
      "![Banner](./assets/banner.png)",
      "",
      "```md",
      "[kept](./harnesses.md)",
      "```",
    ].join("\n");
    expect(absolutizeDocMarkdown(body, testContext, PAGE_URL)).toBe(
      [
        "See [Harnesses](https://yoink.codes/docs/harnesses/#supported-harnesses), [presets](https://yoink.codes/docs/providers/#presets) and [models.dev](https://models.dev).",
        "",
        "![Banner](https://raw.githubusercontent.com/MajidRaimi/yoink/main/docs/assets/banner.png)",
        "",
        "```md",
        "[kept](./harnesses.md)",
        "```",
      ].join("\n"),
    );
  });

  test("rewrites reference definitions", () => {
    expect(absolutizeDocMarkdown("Read [usage][u].\n\n[u]: ./usage.md\n", testContext, PAGE_URL)).toBe(
      "Read [usage][u].\n\n[u]: https://yoink.codes/docs/usage/",
    );
  });

  test("fails on a link to a missing heading", () => {
    expect(() => absolutizeDocMarkdown("[x](#missing)", testContext, PAGE_URL)).toThrow();
  });
});

describe("harness and preset facts", () => {
  test("harness lines carry the generated config path and status", () => {
    const zed = harnessLinks(HARNESS_FACTS, (id) => ({ url: `https://a/${id}/` })).find((link) => link.title === "Zed");
    expect(zed?.url).toBe("https://a/zed/");
    expect(zed?.description).toContain("(experimental), writes `~/.config/zed/settings.json`");
  });

  test("preset reach follows the protocol table", () => {
    expect(reachById()).toEqual({
      openai: 11,
      "kimi-code": 12,
      moonshot: 12,
      openrouter: 12,
      deepseek: 12,
      zai: 12,
      ollama: 10,
    });
  });

  test("preset lines name their endpoints and reach", () => {
    const [openai] = presetLinks(PROVIDER_PRESETS, HARNESSES, () => ({ url: "https://a/" }));
    expect(openai?.description).toBe(
      "preset `openai`, openai-responses at https://api.openai.com/v1, openai-chat at https://api.openai.com/v1; connects to 11 of 13 harnesses.",
    );
  });

  test("the anchors the index links to exist", () => {
    expect(headingIdsFor({ collection: "docs", slug: "harnesses" }).has(HARNESS_TABLE_ANCHOR)).toBe(true);
    expect(headingIdsFor({ collection: "docs", slug: "providers" }).has(PRESET_TABLE_ANCHOR)).toBe(true);
  });
});

describe("generated files", () => {
  const index = llmsIndex();
  const full = llmsFull();

  test("llms.txt opens with the brand and summary and lists every doc with its twin", () => {
    expect(index.startsWith(`# Yoink\n\n> ${LLMS_SUMMARY}\n\n`)).toBe(true);
    for (const doc of getDocs()) {
      expect(index).toContain(`- [${doc.title}](https://yoink.codes/docs/${doc.slug}/): ${doc.description}`);
      expect(index).toContain(markdownTwinUrl(`/docs/${doc.slug}/`));
    }
    expect(index.match(/^## .*/gm)).toEqual(["## Docs", "## Guides", "## Harnesses", "## Providers", "## Compare", "## Optional"]);
    expect(index).toContain("- [pi](https://yoink.codes/harnesses/pi/)");
    expect(index).toContain("- [OpenRouter](https://yoink.codes/providers/openrouter/)");
    expect(index).toContain("- [codex](https://yoink.codes/harnesses/codex/)");
    expect(index).toContain("(experimental)");
  });

  test("harness and provider lines link their page's Markdown twin", () => {
    const sectionLines = (title: string): readonly string[] =>
      (index.split(`## ${title}\n\n`)[1] ?? "").split("\n\n")[0]?.split("\n") ?? [];
    const lines = [...sectionLines("Harnesses"), ...sectionLines("Providers")];
    expect(lines).toHaveLength(HARNESS_FACTS.length + PROVIDER_PRESETS.length);
    for (const line of lines) {
      const url = /\]\((https:\/\/yoink\.codes\/[^)]+)\)/.exec(line)?.[1] ?? "";
      expect(line).toEndWith(`Markdown: ${markdownTwinUrl(new URL(url).pathname)}`);
    }
  });

  test("llms-full.txt holds every doc in nav order with absolute links", () => {
    const sources = [...full.matchAll(/^Source: (.*)$/gm)].map((match) => match[1]);
    expect(sources.slice(0, getDocs().length)).toEqual(getDocs().map((doc) => `https://yoink.codes/docs/${doc.slug}/`));
    expect(sources).toHaveLength(allEntryRefs().length);
    expect(sources.at(-1)).toBe("https://yoink.codes/faq/");
    expect(full).not.toMatch(/\]\((?!https?:\/\/)[^)]*\)/);
    expect(full).not.toMatch(/^---\ntitle:/m);
  });

  test("harness and provider documents carry the generated facts table", () => {
    expect(getEntries("harnesses").length).toBeGreaterThan(0);
    expect(full).toContain("## At a glance\n\n| Fact | Value |");
    expect(full).not.toContain("Also at [yoink.codes");
  });

  test("generated text has no em or en dashes", () => {
    expect(index).not.toMatch(/[\u2013\u2014]/);
  });

  test("each twin starts with its title and canonical source", () => {
    const twins = markdownTwins();
    expect(twins.map((twin) => twin.path).toSorted()).toEqual(allEntryRefs().map(entryUrlPath).toSorted());
    for (const twin of twins) expect(twin.markdown).toContain(`Source: https://yoink.codes${twin.path}\n`);
  });
});
