# Usage

`yoink` switches between Claude Code accounts, switches [subscription logins](./subscriptions.md) for ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot, and manages API-key providers across your coding harnesses (pi, omp, opencode, codex, and Claude Code). This page covers every command, the shorthand for switching, and a few common examples.

## Commands

| Command | Aliases | What it does |
| --- | --- | --- |
| `yoink` | | Open the interactive account menu. |
| `yoink <name>` | | Switch straight to a saved profile. |
| `yoink add` | `login` | Add a Claude account, a Codex, Kimi, Gemini, or Copilot login, or an API-key provider. Interactive by default; pass flags to add a provider from a script (see below). |
| `yoink edit <name>` | | Edit a profile (rename a Claude account; for a provider, change its harnesses, models, id, display name, API key, or endpoints). |
| `yoink save <name>` | | Snapshot the current live Claude login as a profile. Add `--tool <tool>` (`codex`, `kimi`, `gemini`, `copilot`) to snapshot that tool's login instead. |
| `yoink use <name>` | `switch` | Switch to a saved profile. Claude accounts and providers switch Claude Code; a subscription profile switches only its own tool. Warns if the tool is running (from a script, refuses unless `--force`); no-ops if already active. |
| `yoink connect <name>` | | Connect a provider to harnesses (`--to pi,opencode` skips the picker). |
| `yoink disconnect <name>` | | Remove a provider from harnesses (`--from codex`, or every harness it is in). |
| `yoink models <name>` | | Choose which models a provider exposes, then re-sync its harnesses (`--set a,b` skips the picker). |
| `yoink harnesses` | | Show detected harnesses, their config paths, and their providers (`--json` for scripts). |
| `yoink import` | | Import providers already configured in your harnesses (`--yes` skips the prompt). |
| `yoink list` | `ls` | List all saved profiles grouped by tool, marking the active one in each group (`--json` for scripts). |
| `yoink current` | `who` | Show the active profile for Claude Code and each subscription tool (`--tool <tool>` for one). |
| `yoink rename <a> <b>` | | Rename a profile (a provider is renamed in every harness too). |
| `yoink remove <name>` | `rm` | Delete a profile (a provider is disconnected from every harness first). |
| `yoink version` | `-v`, `--version` | Print the version. |
| `yoink help` | `-h`, `--help` | Print help. |

Any unrecognized argument is treated as a profile name, so `yoink work` and `yoink use work` are identical.

## Interactive or scripted

Adding a Claude account always needs an interactive terminal, because it runs the Claude sign-in. Everything provider-related also works without one:

| Command | Non-interactive form |
| --- | --- |
| `yoink add` | `yoink add --external --name <id> (--preset <p> \| --base-url <u> [--protocol <p,...>]) --models <m,...> [--connect <h,...>] [--default <m>] --token-stdin` |
| `yoink add` (legacy Claude Code provider) | `yoink add --external --name <n> --provider <p> --base-url <u> --model <m> --token-stdin` |
| `yoink edit <name>` | `yoink edit <name> [--name <n>] [--provider <p>] [--base-url <u>] [--model <m>] [--token-stdin]` |
| `yoink connect <name>` | `yoink connect <name> --to <h,...> [--default <m>]` |
| `yoink disconnect <name>` | `yoink disconnect <name> [--from <h,...>]` |
| `yoink models <name>` | `yoink models <name> --set <m,...>` |
| `yoink import` | `yoink import --yes` |
| `yoink save` (subscription) | `yoink save <name> --tool <tool>` |
| `yoink use` (tool running) | `yoink use <name> --force` |
| `yoink list` | `yoink list --json` |

`--token-stdin` reads the API key from stdin, so it never lands in your shell history. Harness ids are `pi`, `omp`, `opencode`, `codex`, and `claude-code`. Every flag is described in [Providers](./providers.md#non-interactive-add) and [Harnesses](./harnesses.md#commands).

## Examples

```bash
yoink add

yoink list

yoink work

yoink use personal

yoink current

yoink save temp

yoink rename temp scratch

yoink remove scratch
```

Subscription logins in other tools:

```bash
yoink save codex-work --tool codex

yoink use codex-work

yoink use kimi-personal --force

yoink current --tool gemini

yoink list --json
```

Providers across harnesses:

```bash
echo "$FUSE_API_KEY" | yoink add --external --name fuse --provider Fuse \
  --base-url https://api.fuse.example/v1 --models claude-sonnet-4-5,gpt-5.2 \
  --connect pi,opencode --default claude-sonnet-4-5 --token-stdin

yoink harnesses

yoink connect fuse --to omp

yoink models fuse --set claude-sonnet-4-5,gpt-5.2,kimi-k2

yoink disconnect fuse --from opencode

yoink import
```

## Related

- [Interactive menu](./interactive-menu.md): keymap and behavior of the `yoink` account menu.
- [Providers](./providers.md): presets, custom providers, model selection, and Claude Code scope.
- [Harnesses](./harnesses.md): what yoink writes into pi, omp, opencode, codex, and Claude Code.
- [Subscriptions](./subscriptions.md): switching ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot logins.
