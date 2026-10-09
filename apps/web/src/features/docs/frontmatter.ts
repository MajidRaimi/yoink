import { DEMO_IDS, DOC_SECTIONS, type DemoId, type DocMeta, type DocSection } from "@/shared/contract";
import type { DocSlug } from "@/shared/lib/routes";

export class DocFrontmatterError extends Error {
  constructor(slug: string, problem: string) {
    super(`docs/${slug}.md frontmatter: ${problem}`);
    this.name = "DocFrontmatterError";
  }
}

type RawFrontmatter = Readonly<Record<string, unknown>>;

const requireText = (slug: DocSlug, data: RawFrontmatter, field: string): string => {
  const value = data[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new DocFrontmatterError(slug, `"${field}" must be a non-empty string`);
  }
  return value.trim();
};

const requireOrder = (slug: DocSlug, data: RawFrontmatter): number => {
  const value = data.order;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new DocFrontmatterError(slug, `"order" must be a positive integer`);
  }
  return value;
};

const isDocSection = (value: unknown): value is DocSection =>
  typeof value === "string" && (DOC_SECTIONS as readonly string[]).includes(value);

const isDemoId = (value: unknown): value is DemoId =>
  typeof value === "string" && (DEMO_IDS as readonly string[]).includes(value);

const requireSection = (slug: DocSlug, data: RawFrontmatter): DocSection => {
  if (!isDocSection(data.section)) {
    throw new DocFrontmatterError(slug, `"section" must be one of ${DOC_SECTIONS.join(", ")}`);
  }
  return data.section;
};

const optionalDemo = (slug: DocSlug, data: RawFrontmatter): DemoId | undefined => {
  if (data.demo === undefined) return undefined;
  if (!isDemoId(data.demo)) throw new DocFrontmatterError(slug, `"demo" must be one of ${DEMO_IDS.join(", ")}`);
  return data.demo;
};

export const parseDocMeta = (slug: DocSlug, data: RawFrontmatter): DocMeta => {
  const demo = optionalDemo(slug, data);
  return {
    slug,
    title: requireText(slug, data, "title"),
    description: requireText(slug, data, "description"),
    nav: requireText(slug, data, "nav"),
    order: requireOrder(slug, data),
    section: requireSection(slug, data),
    ...(demo === undefined ? {} : { demo }),
  };
};

export const assertUniqueOrder = (docs: readonly DocMeta[]): void => {
  const seen = new Map<number, DocSlug>();
  for (const doc of docs) {
    const clash = seen.get(doc.order);
    if (clash !== undefined) throw new DocFrontmatterError(doc.slug, `"order" ${doc.order} is already used by ${clash}`);
    seen.set(doc.order, doc.slug);
  }
};

export const assertSectionsFollowOrder = (docs: readonly DocMeta[]): void => {
  const sorted = [...docs].sort((left, right) => left.order - right.order);
  sorted.reduce((previous, doc) => {
    const rank = DOC_SECTIONS.indexOf(doc.section);
    if (rank < previous) {
      throw new DocFrontmatterError(doc.slug, `"section" ${doc.section} breaks the nav order of ${DOC_SECTIONS.join(", ")}`);
    }
    return rank;
  }, 0);
};
