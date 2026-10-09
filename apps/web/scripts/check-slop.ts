import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import ts from "typescript";

export type SlopRule =
  | "comment"
  | "any"
  | "dash"
  | "banned-import"
  | "scroll-listener"
  | "gradient-text"
  | "backdrop-blur"
  | "emoji"
  | "banned-copy";

export type SlopFinding = {
  file: string;
  line: number;
  column: number;
  rule: SlopRule;
  message: string;
};

export type ScanOptions = {
  exemptFromNeedles?: boolean;
};

type Located = Omit<SlopFinding, "file">;

const WEB_ROOT = resolve(import.meta.dir, "..");
const REPO_ROOT = resolve(WEB_ROOT, "..", "..");

const SOURCE_ROOTS: readonly string[] = [join(WEB_ROOT, "src"), join(WEB_ROOT, "scripts"), join(WEB_ROOT, "e2e")];
const SOURCE_FILES: readonly string[] = [
  join(WEB_ROOT, "playwright.config.ts"),
  join(WEB_ROOT, "lighthouserc.json"),
  join(WEB_ROOT, "next.config.ts"),
  join(WEB_ROOT, "postcss.config.mjs"),
  join(WEB_ROOT, "tsconfig.json"),
  join(REPO_ROOT, "packages", "tokens", "tokens.css"),
  join(REPO_ROOT, "README.md"),
];
const PUBLIC_ROOT = join(WEB_ROOT, "public");
const PUBLIC_EXTENSIONS: ReadonlySet<string> = new Set([".svg", ".webmanifest"]);
const DOCS_ROOT = join(REPO_ROOT, "docs");
const SKIPPED_DIRECTORIES: ReadonlySet<string> = new Set(["node_modules", ".next", "out", ".lighthouseci", "test-results"]);
const SCANNED_EXTENSIONS: ReadonlySet<string> = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".js",
  ".mjs",
  ".css",
  ".md",
  ".mdx",
  ".json",
]);
const SCRIPT_KINDS: Readonly<Record<string, ts.ScriptKind>> = {
  ".ts": ts.ScriptKind.TS,
  ".mts": ts.ScriptKind.TS,
  ".tsx": ts.ScriptKind.TSX,
  ".js": ts.ScriptKind.JS,
  ".mjs": ts.ScriptKind.JS,
};
const JSONC_FILE = /^tsconfig(\.[\w-]+)?\.json$/;
const SELF_EXEMPT: ReadonlySet<string> = new Set([
  join(WEB_ROOT, "scripts", "check-slop.ts"),
  join(WEB_ROOT, "scripts", "check-slop.test.ts"),
]);

const DASHES: Readonly<Record<string, string>> = {
  "\u2014": "em dash",
  "\u2013": "en dash",
};

const BANNED_MODULE = /^(lucide-react|three)(\/|$)/;
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/gu;

const STYLE_NEEDLES: readonly { pattern: RegExp; rule: SlopRule; message: string }[] = [
  { pattern: /\bbg-clip-text\b/g, rule: "gradient-text", message: "gradient text utility bg-clip-text" },
  { pattern: /background-clip\s*:\s*text/g, rule: "gradient-text", message: "gradient text via background-clip: text" },
  { pattern: /\bbackdrop-blur(-[a-z0-9]+)?\b/g, rule: "backdrop-blur", message: "glassmorphism utility backdrop-blur" },
  { pattern: /backdrop-filter\s*:/g, rule: "backdrop-blur", message: "glassmorphism via backdrop-filter" },
];

export const BANNED_PHRASES: readonly { pattern: RegExp; label: string }[] = [
  { pattern: /\bsupercharg\w*/gi, label: "supercharge" },
  { pattern: /\bseamless\w*/gi, label: "seamless" },
  { pattern: /\beffortless\w*/gi, label: "effortless" },
  { pattern: /\bunleash\w*/gi, label: "unleash" },
  { pattern: /\bempower\w*/gi, label: "empower" },
  { pattern: /\bmagic(al|ally)?\b/gi, label: "magic" },
  { pattern: /\b(not|isn't|is not) just\b[^.!?\n]{0,80}?\b(it's|it is|it\u2019s)\b/gi, label: "not just X, it's Y" },
  { pattern: /\bsay goodbye to\b/gi, label: "say goodbye to" },
  { pattern: /\bsimply\b/gi, label: "simply" },
  { pattern: /\bjust works\b/gi, label: "just works" },
  { pattern: /\btrusted by thousands\b/gi, label: "trusted by thousands" },
];

const lineStarts = (text: string): readonly number[] => {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") starts.push(index + 1);
  }
  return starts;
};

const createLocator = (text: string): ((offset: number) => { line: number; column: number }) => {
  const starts = lineStarts(text);
  return (offset) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if ((starts[middle] ?? 0) <= offset) low = middle;
      else high = middle - 1;
    }
    return { line: low + 1, column: offset - (starts[low] ?? 0) + 1 };
  };
};

const matchAll = (
  text: string,
  baseOffset: number,
  pattern: RegExp,
  locate: (offset: number) => { line: number; column: number },
  build: (match: RegExpExecArray) => Pick<SlopFinding, "rule" | "message">,
): Located[] =>
  [...text.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`))].map(
    (match) => ({ ...locate(baseOffset + match.index), ...build(match) }),
  );

const scanDashes = (text: string, locate: (offset: number) => { line: number; column: number }): Located[] =>
  matchAll(text, 0, /[\u2013\u2014]/g, locate, (match) => ({
    rule: "dash",
    message: `${DASHES[match[0]] ?? "dash"} character`,
  }));

const scanEmoji = (text: string, locate: (offset: number) => { line: number; column: number }): Located[] =>
  matchAll(text, 0, EMOJI, locate, (match) => ({
    rule: "emoji",
    message: `emoji ${[...match[0]].map((char) => `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase()}`).join(" ")}`,
  }));

const scanStyleNeedles = (text: string, locate: (offset: number) => { line: number; column: number }): Located[] =>
  STYLE_NEEDLES.flatMap((needle) =>
    matchAll(text, 0, needle.pattern, locate, () => ({ rule: needle.rule, message: needle.message })),
  );

const scanPhrases = (
  text: string,
  baseOffset: number,
  locate: (offset: number) => { line: number; column: number },
): Located[] =>
  BANNED_PHRASES.flatMap((phrase) =>
    matchAll(text, baseOffset, phrase.pattern, locate, (match) => ({
      rule: "banned-copy",
      message: `banned copy "${phrase.label}" in "${match[0]}"`,
    })),
  );

const collectComments = (sourceFile: ts.SourceFile): readonly ts.CommentRange[] => {
  const text = sourceFile.getFullText();
  const seen = new Map<number, ts.CommentRange>();
  const record = (ranges: readonly ts.CommentRange[] | undefined): void => {
    for (const range of ranges ?? []) seen.set(range.pos, range);
  };
  const visit = (node: ts.Node): void => {
    if (node.kind === ts.SyntaxKind.JsxText) return;
    if (node.kind !== ts.SyntaxKind.SourceFile) {
      record(ts.getLeadingCommentRanges(text, node.pos));
      record(ts.getTrailingCommentRanges(text, node.end));
    }
    for (const child of node.getChildren(sourceFile)) visit(child);
  };
  visit(sourceFile);
  return [...seen.values()].sort((left, right) => left.pos - right.pos);
};

const moduleSpecifierOf = (node: ts.Node): ts.StringLiteralLike | undefined => {
  if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined) {
    return ts.isStringLiteralLike(node.moduleSpecifier) ? node.moduleSpecifier : undefined;
  }
  if (ts.isCallExpression(node)) {
    const [first] = node.arguments;
    const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
    const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
    if ((isDynamicImport || isRequire) && first !== undefined && ts.isStringLiteralLike(first)) return first;
  }
  if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
    return node.argument.literal;
  }
  return undefined;
};

const isScrollListener = (node: ts.Node): boolean => {
  if (!ts.isCallExpression(node)) return false;
  const callee = node.expression;
  const name = ts.isPropertyAccessExpression(callee)
    ? callee.name.text
    : ts.isElementAccessExpression(callee) && ts.isStringLiteralLike(callee.argumentExpression)
      ? callee.argumentExpression.text
      : undefined;
  const [first] = node.arguments;
  return name === "addEventListener" && first !== undefined && ts.isStringLiteralLike(first) && first.text === "scroll";
};

const copyTextOf = (node: ts.Node, sourceFile: ts.SourceFile): { text: string; offset: number } | undefined => {
  if (ts.isJsxText(node)) return { text: node.getText(sourceFile), offset: node.getStart(sourceFile) };
  if (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isTemplateHead(node) ||
    ts.isTemplateMiddle(node) ||
    ts.isTemplateTail(node)
  ) {
    return { text: node.text, offset: node.getStart(sourceFile) };
  }
  return undefined;
};

export const scanTypeScript = (file: string, text: string, options: ScanOptions = {}): SlopFinding[] => {
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    SCRIPT_KINDS[extname(file)] ?? ts.ScriptKind.TS,
  );
  const locate = createLocator(text);
  const findings: Located[] = [];

  for (const comment of collectComments(sourceFile)) {
    const kind = comment.kind === ts.SyntaxKind.SingleLineCommentTrivia ? "line" : "block";
    findings.push({ ...locate(comment.pos), rule: "comment", message: `${kind} comment` });
  }

  const visit = (node: ts.Node): void => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      findings.push({ ...locate(node.getStart(sourceFile)), rule: "any", message: "any in a type position" });
    }
    const specifier = moduleSpecifierOf(node);
    if (specifier !== undefined && BANNED_MODULE.test(specifier.text)) {
      findings.push({
        ...locate(specifier.getStart(sourceFile)),
        rule: "banned-import",
        message: `import of banned module "${specifier.text}"`,
      });
    }
    if (isScrollListener(node)) {
      findings.push({
        ...locate(node.getStart(sourceFile)),
        rule: "scroll-listener",
        message: 'addEventListener("scroll") listener',
      });
    }
    if (options.exemptFromNeedles !== true) {
      const copy = copyTextOf(node, sourceFile);
      if (copy !== undefined) findings.push(...scanPhrases(copy.text, copy.offset, locate));
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  findings.push(...scanDashes(text, locate), ...scanEmoji(text, locate));
  if (options.exemptFromNeedles !== true) findings.push(...scanStyleNeedles(text, locate));
  return findings.map((finding) => ({ file, ...finding }));
};

type CssState = "code" | "single" | "double" | "comment";

export const scanCss = (file: string, text: string, options: ScanOptions = {}): SlopFinding[] => {
  const locate = createLocator(text);
  const findings: Located[] = [];
  let state: CssState = "code";
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (state === "comment") {
      if (char === "*" && next === "/") {
        state = "code";
        index += 1;
      }
      continue;
    }
    if (state === "single" || state === "double") {
      if (char === "\\") index += 1;
      else if ((state === "single" && char === "'") || (state === "double" && char === '"')) state = "code";
      continue;
    }
    if (char === "'") state = "single";
    else if (char === '"') state = "double";
    else if (char === "/" && next === "*") {
      findings.push({ ...locate(index), rule: "comment", message: "block comment" });
      state = "comment";
      index += 1;
    }
  }
  findings.push(...scanDashes(text, locate), ...scanEmoji(text, locate));
  if (options.exemptFromNeedles !== true) findings.push(...scanStyleNeedles(text, locate));
  return findings.map((finding) => ({ file, ...finding }));
};

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

const proseRanges = (text: string): readonly { start: number; end: number }[] => {
  const ranges: { start: number; end: number }[] = [];
  let offset = 0;
  let fence: string | null = null;
  let proseStart = 0;
  for (const line of text.split("\n")) {
    const marker = FENCE.exec(line)?.[1];
    if (marker !== undefined) {
      if (fence === null) {
        ranges.push({ start: proseStart, end: offset });
        fence = marker;
      } else if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null;
        proseStart = offset + line.length + 1;
      }
    }
    offset += line.length + 1;
  }
  if (fence === null) ranges.push({ start: proseStart, end: text.length });
  return ranges;
};

export const scanMarkdown = (file: string, text: string): SlopFinding[] => {
  const locate = createLocator(text);
  const prose = proseRanges(text);
  const findings: Located[] = [...scanDashes(text, locate), ...scanEmoji(text, locate)];
  for (const range of prose) {
    const slice = text.slice(range.start, range.end);
    findings.push(...scanPhrases(slice, range.start, locate));
    findings.push(
      ...matchAll(slice, range.start, /<!--/g, locate, () => ({ rule: "comment", message: "HTML comment" })),
    );
  }
  return findings.map((finding) => ({ file, ...finding }));
};

export const scanPlainText = (file: string, text: string): SlopFinding[] => {
  const locate = createLocator(text);
  return [...scanDashes(text, locate), ...scanEmoji(text, locate)].map((finding) => ({ file, ...finding }));
};

export const scanMarkup = (file: string, text: string): SlopFinding[] => {
  const locate = createLocator(text);
  return [
    ...scanDashes(text, locate),
    ...scanEmoji(text, locate),
    ...matchAll(text, 0, /<!--/g, locate, () => ({ rule: "comment" as const, message: "markup comment" })),
  ].map((finding) => ({ file, ...finding }));
};

export const scanJsonc = (file: string, text: string): SlopFinding[] =>
  scanTypeScript(file, `(${text}\n)`, { exemptFromNeedles: true }).map((finding) =>
    finding.line === 1 ? { ...finding, column: finding.column - 1 } : finding,
  );

export const scanFile = (file: string, text: string): SlopFinding[] => {
  const options: ScanOptions = { exemptFromNeedles: SELF_EXEMPT.has(file) };
  const extension = extname(file);
  if (extension in SCRIPT_KINDS) return scanTypeScript(file, text, options);
  if (JSONC_FILE.test(basename(file))) return scanJsonc(file, text);
  if (extension === ".svg") return scanMarkup(file, text);
  if (extension === ".css") return scanCss(file, text, options);
  if (extension === ".md" || extension === ".mdx") return scanMarkdown(file, text);
  return scanPlainText(file, text);
};

const walk = (directory: string, extensions: ReadonlySet<string> = SCANNED_EXTENSIONS): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRECTORIES.has(entry.name) ? [] : walk(path, extensions);
    return entry.isFile() && extensions.has(extname(entry.name)) ? [path] : [];
  });

const exists = (path: string): boolean => {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
};

export const collectSlopTargets = (): readonly string[] => {
  const sources = SOURCE_ROOTS.filter(exists).flatMap((root) => walk(root));
  const extras = SOURCE_FILES.filter(exists);
  const publicFiles = exists(PUBLIC_ROOT) ? walk(PUBLIC_ROOT, PUBLIC_EXTENSIONS) : [];
  const docs = exists(DOCS_ROOT)
    ? readdirSync(DOCS_ROOT)
        .filter((name) => extname(name) === ".md")
        .map((name) => join(DOCS_ROOT, name))
    : [];
  return [...new Set([...sources, ...extras, ...publicFiles, ...docs])].sort();
};

export const checkSlop = (files: readonly string[]): readonly SlopFinding[] =>
  files.flatMap((file) => scanFile(file, readFileSync(file, "utf8")));

export const formatSlopReport = (findings: readonly SlopFinding[], scannedCount: number): string => {
  if (findings.length === 0) return `check:slop passed (${scannedCount} files scanned)`;
  const byFile = Map.groupBy(findings, (finding) => finding.file);
  const sections = [...byFile.entries()].map(([file, fileFindings]) => {
    const lines = fileFindings
      .toSorted((left, right) => left.line - right.line || left.column - right.column)
      .map((finding) => `  ${finding.line}:${finding.column}  ${finding.rule.padEnd(16)} ${finding.message}`);
    return [relative(REPO_ROOT, file), ...lines].join("\n");
  });
  const counts = Object.entries(Object.groupBy(findings, (finding) => finding.rule))
    .map(([rule, group]) => `${rule}: ${group?.length ?? 0}`)
    .join(", ");
  return [
    ...sections,
    "",
    `check:slop failed: ${findings.length} finding(s) in ${byFile.size} file(s) of ${scannedCount} scanned (${counts})`,
  ].join("\n");
};

if (import.meta.main) {
  const files = collectSlopTargets();
  const findings = checkSlop(files);
  const report = formatSlopReport(findings, files.length);
  if (findings.length === 0) {
    console.log(report);
  } else {
    console.error(report);
    process.exit(1);
  }
}
