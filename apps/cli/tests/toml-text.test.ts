import { expect, test } from "bun:test";
import { removeTableSections } from "../src/features/harnesses/adapters/toml-text";

const prefix = ["model_providers", "fuse"];

test("removeTableSections keeps comments that sit above the following table", () => {
  const source = `model = "x"

[model_providers.fuse]
name = "Fuse"

# MCP servers below, keep tokens in sync!
[mcp_servers.gh]
command = "gh"
`;
  expect(removeTableSections(source, prefix)).toBe(`model = "x"

# MCP servers below, keep tokens in sync!
[mcp_servers.gh]
command = "gh"
`);
});

test("removeTableSections keeps the following comment block across adjacent doomed subtables", () => {
  const source = `[model_providers.fuse]
name = "Fuse"

[model_providers.fuse.http_headers]
X-Old = "1"
# trailing note for gh
[mcp_servers.gh]
command = "gh"
`;
  expect(removeTableSections(source, prefix)).toBe(`# trailing note for gh
[mcp_servers.gh]
command = "gh"
`);
});

test("removeTableSections keeps separation when the previous table has no trailing blank", () => {
  const source = `[a]
x = 1
[model_providers.fuse]
name = "Fuse"

# next
[b]
y = 2
`;
  expect(removeTableSections(source, prefix)).toBe(`[a]
x = 1

# next
[b]
y = 2
`);
});

test("removeTableSections drops trailing comments when the doomed table ends the file", () => {
  const source = `[a]
x = 1

[model_providers.fuse]
name = "Fuse"
# fuse note
`;
  expect(removeTableSections(source, prefix)).toBe(`[a]
x = 1
`);
});

test("removeTableSections removes non-adjacent matches and keeps tables in between", () => {
  const source = `[model_providers.fuse]
name = "Fuse"

# keep me
[mcp_servers.gh]
command = "gh"

[model_providers.fuse.http_headers]
X-Old = "1"

[c]
z = 3
`;
  expect(removeTableSections(source, prefix)).toBe(`# keep me
[mcp_servers.gh]
command = "gh"

[c]
z = 3
`);
});

test("removeTableSections returns the text unchanged when nothing matches", () => {
  const source = "[a]\nx = 1\n";
  expect(removeTableSections(source, prefix)).toBe(source);
});
