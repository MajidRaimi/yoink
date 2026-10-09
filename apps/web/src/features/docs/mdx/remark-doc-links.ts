import { posix } from "node:path";
import { docPath, isDocSlug, type DocSlug } from "@/shared/lib/routes";
import { repoBlobUrl, repoRawUrl } from "../links";
import { walk, type TreeNode } from "./syntax-tree";

export class DocLinkError extends Error {
  constructor(source: DocSlug, target: string, problem: string) {
    super(`docs/${source}.md links to "${target}": ${problem}`);
    this.name = "DocLinkError";
  }
}

export type DocLinkContext = {
  source: DocSlug;
  headingIds: (slug: DocSlug) => ReadonlySet<string>;
  repoFileExists: (repoPath: string) => boolean;
};

const PASSTHROUGH = /^(https?:|mailto:)/i;
const DOC_FILE = /^docs\/([a-z0-9-]+)\.md$/;

const splitHash = (url: string): { path: string; hash: string } => {
  const index = url.indexOf("#");
  return index === -1 ? { path: url, hash: "" } : { path: url.slice(0, index), hash: url.slice(index + 1) };
};

const toRepoPath = (relativePath: string): string => posix.normalize(posix.join("docs", relativePath));

const assertHeading = (context: DocLinkContext, target: DocSlug, hash: string, url: string): void => {
  if (hash.length === 0 || context.headingIds(target).has(hash)) return;
  throw new DocLinkError(context.source, url, `docs/${target}.md has no heading with id "${hash}"`);
};

const withHash = (base: string, hash: string): string => (hash.length === 0 ? base : `${base}#${hash}`);

export const rewriteDocUrl = (url: string, context: DocLinkContext): string => {
  if (PASSTHROUGH.test(url)) return url;
  const { path, hash } = splitHash(url);
  if (path.length === 0) {
    assertHeading(context, context.source, hash, url);
    return url;
  }
  if (path.startsWith("/")) throw new DocLinkError(context.source, url, "use a relative path so GitHub can follow it");
  const repoPath = toRepoPath(path);
  const docMatch = DOC_FILE.exec(repoPath)?.[1];
  if (docMatch !== undefined && isDocSlug(docMatch)) {
    assertHeading(context, docMatch, hash, url);
    return withHash(docPath(docMatch), hash);
  }
  if (repoPath.startsWith("..") || !context.repoFileExists(repoPath)) {
    throw new DocLinkError(context.source, url, "no such file in the repo");
  }
  return withHash(repoBlobUrl(repoPath), hash);
};

export const rewriteImageUrl = (url: string, context: DocLinkContext): string => {
  if (PASSTHROUGH.test(url)) return url;
  const repoPath = toRepoPath(url);
  if (repoPath.startsWith("..") || !context.repoFileExists(repoPath)) {
    throw new DocLinkError(context.source, url, "no such image in the repo");
  }
  return repoRawUrl(repoPath);
};

const LINK_TYPES: ReadonlySet<string> = new Set(["link", "definition"]);

export const remarkDocLinks =
  (context: DocLinkContext): ((tree: TreeNode) => void) =>
  (tree) => {
    walk(tree, (node) => {
      if (typeof node.url !== "string") return;
      if (LINK_TYPES.has(node.type)) node.url = rewriteDocUrl(node.url, context);
      else if (node.type === "image") node.url = rewriteImageUrl(node.url, context);
    });
  };
