import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

export type SitemapEntry = {
  loc: string;
  lastmod: string | null;
};

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

export type KeyPollDeps = {
  fetchText: (url: string) => Promise<string | null>;
  sleep: (ms: number) => Promise<void>;
};

type CliOptions = {
  sitemap: string;
  previous: string | null;
  all: boolean;
  dryRun: boolean;
};

export const SITE_HOST = "yoink.codes";
export const SITE_ORIGIN = `https://${SITE_HOST}`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const BATCH_SIZE = 10_000;
export const KEY_WAIT_BUDGET_MS = 5 * 60 * 1000;

const KEY_FILE_PATTERN = /^([0-9a-f]{8,128})\.txt$/;
const REQUEST_TIMEOUT_MS = 15_000;
const FIRST_DELAY_MS = 5_000;
const MAX_DELAY_MS = 60_000;
const WEB_ROOT = join(import.meta.dir, "..");
const PUBLIC_DIR = join(WEB_ROOT, "public");
const DEFAULT_SITEMAP = join(WEB_ROOT, "out", "sitemap.xml");

const XML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

const decodeXml = (value: string): string =>
  value.replace(/&(amp|lt|gt|quot|apos);/g, (entity) => XML_ENTITIES[entity] ?? entity);

const tagValue = (block: string, tag: string): string | null => {
  const match = new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`).exec(block);
  return match?.[1] ? decodeXml(match[1]) : null;
};

export const parseSitemap = (xml: string): SitemapEntry[] =>
  Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/g)).flatMap((match) => {
    const block = match[1] ?? "";
    const loc = tagValue(block, "loc");
    return loc ? [{ loc, lastmod: tagValue(block, "lastmod") }] : [];
  });

const isOnHost = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.host === SITE_HOST;
  } catch {
    return false;
  }
};

export const selectUrls = (
  current: readonly SitemapEntry[],
  previous: readonly SitemapEntry[] | null,
  submitAll: boolean,
): string[] => {
  const previousLastmod = new Map((previous ?? []).map((entry) => [entry.loc, entry.lastmod]));
  const changed = (entry: SitemapEntry): boolean =>
    submitAll || previous === null || !previousLastmod.has(entry.loc) || previousLastmod.get(entry.loc) !== entry.lastmod;
  return Array.from(new Set(current.filter((entry) => isOnHost(entry.loc) && changed(entry)).map((entry) => entry.loc)));
};

export const keyLocationFor = (key: string): string => `${SITE_ORIGIN}/${key}.txt`;

export const buildPayloads = (key: string, urls: readonly string[]): IndexNowPayload[] =>
  Array.from({ length: Math.ceil(urls.length / BATCH_SIZE) }, (_, index) => ({
    host: SITE_HOST,
    key,
    keyLocation: keyLocationFor(key),
    urlList: urls.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE),
  }));

export const backoffDelays = (budgetMs: number): number[] => {
  const delays: number[] = [];
  let total = 0;
  let next = FIRST_DELAY_MS;
  while (total + next <= budgetMs) {
    delays.push(next);
    total += next;
    next = Math.min(next * 2, MAX_DELAY_MS);
  }
  return delays;
};

export const findKey = (fileNames: readonly string[], readBody: (name: string) => string): string | null =>
  fileNames
    .map((name) => ({ name, key: KEY_FILE_PATTERN.exec(name)?.[1] }))
    .find(({ name, key }) => key !== undefined && readBody(name) === key)?.key ?? null;

export const describeStatus = (status: number): string => {
  const meanings: Record<number, string> = {
    200: "URLs submitted",
    202: "URLs received, key validation pending",
    400: "bad request",
    403: "key not valid for this host",
    422: "URLs do not belong to the host or the key does not match",
    429: "too many requests",
  };
  return meanings[status] ?? "unexpected response";
};

export const waitForKey = async (key: string, deps: KeyPollDeps, budgetMs: number = KEY_WAIT_BUDGET_MS): Promise<boolean> => {
  const url = keyLocationFor(key);
  for (const delay of [0, ...backoffDelays(budgetMs)]) {
    if (delay > 0) await deps.sleep(delay);
    const body = await deps.fetchText(url);
    if (body?.trim() === key) return true;
    console.log(`key file not live yet at ${url}`);
  }
  return false;
};

const describeError = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const fetchText = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    return response.ok ? await response.text() : null;
  } catch (error) {
    console.warn(`request to ${url} failed: ${describeError(error)}`);
    return null;
  }
};

const isUrl = (source: string): boolean => /^https?:\/\//.test(source);

const readSource = async (source: string): Promise<string | null> => {
  if (isUrl(source)) return fetchText(source);
  try {
    return readFileSync(source, "utf8");
  } catch {
    return null;
  }
};

const readPrevious = async (source: string | null): Promise<SitemapEntry[] | null> => {
  if (!source) return null;
  const xml = await readSource(source);
  const entries = xml ? parseSitemap(xml) : [];
  return entries.length > 0 ? entries : null;
};

const submitBatch = async (payload: IndexNowPayload): Promise<void> => {
  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const detail = (await response.text()).trim();
    console.log(
      `IndexNow ${response.status} (${describeStatus(response.status)}) for ${payload.urlList.length} URLs${detail ? `: ${detail}` : ""}`,
    );
  } catch (error) {
    console.warn(`IndexNow request failed: ${describeError(error)}`);
  }
};

const parseCli = (): CliOptions => {
  const { values } = parseArgs({
    options: {
      sitemap: { type: "string", default: DEFAULT_SITEMAP },
      previous: { type: "string" },
      all: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
    },
  });
  return {
    sitemap: values.sitemap ?? DEFAULT_SITEMAP,
    previous: values.previous ?? null,
    all: values.all ?? false,
    dryRun: values["dry-run"] ?? false,
  };
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const main = async (): Promise<void> => {
  const options = parseCli();
  const key = findKey(readdirSync(PUBLIC_DIR), (name) => readFileSync(join(PUBLIC_DIR, name), "utf8"));
  if (!key) {
    console.error(`No IndexNow key file found in ${PUBLIC_DIR}`);
    process.exitCode = 1;
    return;
  }
  const currentXml = await readSource(options.sitemap);
  if (!currentXml) {
    console.warn(`Could not read sitemap from ${options.sitemap}, nothing submitted`);
    return;
  }
  const previous = await readPrevious(options.previous);
  if (!options.all && previous === null) console.log("No previous sitemap available, submitting every URL");
  const urls = selectUrls(parseSitemap(currentXml), previous, options.all);
  if (urls.length === 0) {
    console.log("No changed URLs, nothing submitted");
    return;
  }
  const payloads = buildPayloads(key, urls);
  if (options.dryRun) {
    console.log(JSON.stringify(payloads, null, 2));
    return;
  }
  if (!(await waitForKey(key, { fetchText, sleep }))) {
    console.warn(`Key file ${keyLocationFor(key)} did not go live within 5 minutes, nothing submitted`);
    return;
  }
  for (const payload of payloads) await submitBatch(payload);
};

if (import.meta.main) await main();
