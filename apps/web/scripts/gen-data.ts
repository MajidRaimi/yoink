import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HARNESS_ADAPTERS } from "../../cli/src/features/harnesses/registry";
import { PROFILE_GROUP_TITLES } from "../../cli/src/features/profiles/format";
import { PROVIDER_PRESETS } from "../../cli/src/features/providers/presets";
import { SUBSCRIPTION_BACKENDS } from "../../cli/src/features/subscriptions/registry";

export type LiteralValue = string | number | boolean | null | readonly LiteralValue[] | { readonly [key: string]: LiteralValue };

export type ModuleContract = {
  readonly imports: readonly string[];
  readonly satisfies: string;
};

export type GeneratedModule = {
  fileName: string;
  source: string;
};

const INDENT = "  ";
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const isPrimitive = (value: LiteralValue): value is string | number | boolean | null =>
  value === null || typeof value !== "object";

const formatKey = (key: string): string => (IDENTIFIER.test(key) ? key : JSON.stringify(key));

export const toLiteral = (value: LiteralValue, depth = 0): string => {
  if (isPrimitive(value)) return JSON.stringify(value);
  const pad = INDENT.repeat(depth + 1);
  const closePad = INDENT.repeat(depth);
  if (Array.isArray(value)) {
    const items: readonly LiteralValue[] = value;
    if (items.length === 0) return "[]";
    if (items.every(isPrimitive)) return `[${items.map((item) => JSON.stringify(item)).join(", ")}]`;
    return `[\n${items.map((item) => `${pad}${toLiteral(item, depth + 1)},`).join("\n")}\n${closePad}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  return `{\n${entries.map(([key, item]) => `${pad}${formatKey(key)}: ${toLiteral(item, depth + 1)},`).join("\n")}\n${closePad}}`;
};

const CONTRACT_MODULE = "@/shared/contract";

const renderImports = (contract: ModuleContract | undefined): readonly string[] =>
  contract ? [`import type { ${contract.imports.join(", ")} } from "${CONTRACT_MODULE}";`, ""] : [];

const renderAssertion = (contract: ModuleContract | undefined): string =>
  contract ? `as const satisfies ${contract.satisfies}` : "as const";

export const renderModule = (
  constName: string,
  value: LiteralValue,
  typeLines: readonly string[],
  contract?: ModuleContract,
): string =>
  [
    ...renderImports(contract),
    `export const ${constName} = ${toLiteral(value)} ${renderAssertion(contract)};`,
    "",
    ...typeLines,
    "",
  ].join("\n");

export const buildModules = (): GeneratedModule[] => {
  const harnesses = HARNESS_ADAPTERS.map((adapter) => ({
    id: adapter.id,
    label: adapter.label,
    protocols: [...adapter.protocols],
    exclusive: adapter.exclusive,
    experimental: adapter.experimental,
  }));

  const presets = PROVIDER_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    endpoints: preset.endpoints.map((endpoint) => ({ protocol: endpoint.protocol, baseUrl: endpoint.baseUrl })),
    keyUrl: preset.keyUrl ?? null,
  }));

  const subscriptions = SUBSCRIPTION_BACKENDS.map((backend) => ({ tool: backend.tool, label: backend.label }));

  const groups = Object.fromEntries(Object.entries(PROFILE_GROUP_TITLES));

  return [
    {
      fileName: "harnesses.gen.ts",
      source: renderModule("HARNESSES", harnesses, [
        "export type Harness = (typeof HARNESSES)[number];",
        "",
        'export type HarnessId = Harness["id"];',
        "",
        'export type HarnessProtocol = Harness["protocols"][number];',
      ], { imports: ["HarnessData"], satisfies: "readonly HarnessData[]" }),
    },
    {
      fileName: "presets.gen.ts",
      source: renderModule("PROVIDER_PRESETS", presets, [
        "export type ProviderPreset = (typeof PROVIDER_PRESETS)[number];",
        "",
        'export type ProviderPresetId = ProviderPreset["id"];',
        "",
        'export type PresetEndpoint = ProviderPreset["endpoints"][number];',
        "",
        'export type Protocol = PresetEndpoint["protocol"];',
      ], { imports: ["PresetData"], satisfies: "readonly PresetData[]" }),
    },
    {
      fileName: "subscriptions.gen.ts",
      source: renderModule("SUBSCRIPTIONS", subscriptions, [
        "export type Subscription = (typeof SUBSCRIPTIONS)[number];",
        "",
        'export type SubscriptionTool = Subscription["tool"];',
      ], { imports: ["SubscriptionData"], satisfies: "readonly SubscriptionData[]" }),
    },
    {
      fileName: "groups.gen.ts",
      source: renderModule(
        "PROFILE_GROUP_TITLES",
        groups,
        ["export type ProfileGroupTitle = (typeof PROFILE_GROUP_TITLES)[ProfileGroupKey];"],
        { imports: ["ProfileGroupData", "ProfileGroupKey"], satisfies: "ProfileGroupData" },
      ),
    },
  ];
};

const OUTPUT_DIR = join(import.meta.dir, "..", "src", "features", "demos", "data");

const writeModules = (modules: readonly GeneratedModule[]): void => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const generated of modules) {
    writeFileSync(join(OUTPUT_DIR, generated.fileName), generated.source);
    console.log(`wrote src/features/demos/data/${generated.fileName}`);
  }
};

if (import.meta.main) writeModules(buildModules());
