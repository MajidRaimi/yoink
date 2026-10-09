---
title: A different Claude Code provider for one project
seoTitle: "Use a different Claude Code provider per project · Yoink CLI"
description: "Point one repo's Claude Code at OpenRouter or DeepSeek while the rest of your machine keeps your subscription. yoink writes a gitignored settings.local.json."
nav: Per-project Claude Code provider
order: 9
related:
  - docs/guides/claude-code-with-openrouter-kimi-deepseek-zai.md
  - docs/security.md
  - docs/providers.md
---

# A different Claude Code provider for one project

Also at [yoink.codes/guides/per-project-claude-code-provider/](https://yoink.codes/guides/per-project-claude-code-provider/).

To give one repository its own Claude Code provider, run `yoink connect <name>` from the repo root, tick Claude Code, and choose **This project only**. yoink writes the provider's key, URL and model into `./.claude/settings.local.json`, checks that `.gitignore` excludes it, and leaves your global Claude Code login untouched.

## The short answer

```bash
cd ~/code/side-project
yoink connect openrouter
```

In the harness checklist, tick **Claude Code**. yoink asks **Apply to Claude Code where?** with two choices: **Globally** (switches Claude Code everywhere) and **This project only** (writes `./.claude/settings.local.json`). Pick the second, then pick the model. Claude Code always needs one, so there is no "keep current" option here. When it is done, yoink prints `Wrote ./.claude/settings.local.json`. Start Claude Code in that folder and it uses the provider; every other folder keeps your subscription.

The provider must have an Anthropic Messages endpoint. The `openrouter`, `kimi-code`, `moonshot`, `deepseek` and `zai` presets do; `openai` and `ollama` do not. See [Use OpenRouter, Kimi, DeepSeek or z.ai in Claude Code](./claude-code-with-openrouter-kimi-deepseek-zai.md) for the provider side.

## Why settings.local.json wins

Claude Code merges settings from several files. Anthropic's [settings documentation](https://code.claude.com/docs/en/settings) lists the order, highest first:

| Level | File |
| --- | --- |
| Managed | `managed-settings.json`, MDM or the console |
| Command line | `claude --settings` |
| Project local | `.claude/settings.local.json` |
| Shared project | `.claude/settings.json` |
| User | `~/.claude/settings.json` |

yoink's global connection writes the user file. The project scope writes the project local file, which sits above both the user file and the team's committed `.claude/settings.json`. So the override holds even after you run `yoink work` to switch your global Claude Code back to a Claude account: yoink strips the seven keys from `~/.claude/settings.json`, but the project file still names the provider. Only managed settings or `claude --settings` can beat it.

## What gets written

The same seven keys as a global connection, merged into the `env` block of the project file: `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL` and `CLAUDE_CODE_SUBAGENT_MODEL`. Anything else in the file, such as permission rules Claude Code saved there, is kept. yoink creates `.claude/` if it is missing and writes the file owner-only (`0600`).

The path is relative to the directory you run yoink in. Anthropic's docs note that when Claude Code starts in a subdirectory of a git repository, it reads and writes this file at the repository root, so run `yoink connect` from the root.

## The .gitignore check

The key sits in plain text in that file, so yoink checks `.gitignore` in the current directory before writing. It accepts any of these lines as covering the file: `.claude/`, `/.claude/`, `.claude/settings.local.json` or `/.claude/settings.local.json`. If none is there, it asks:

```text
Add .claude/settings.local.json to .gitignore so your API key isn't committed?
```

Yes is the default and appends the line. Saying no brings a second question, "Your API key will sit unignored in .claude/settings.local.json. Continue anyway?", which defaults to no. The check reads only that one `.gitignore`, not nested ignore files or your global git excludes, so it may offer to add a line your setup already covers. Adding it anyway is harmless.

## Refreshing after you edit the provider

A project scope is not recorded as a connection. That has three consequences:

- `yoink edit`, `yoink models` and a key rotation re-sync every recorded harness, but not this file. Run `yoink connect <name>` in the project again and pick **This project only** to refresh it.
- `yoink disconnect` and `yoink remove` do not touch it either. To stop the override, delete the seven keys from `./.claude/settings.local.json`, or the file if yoink created it.
- The project does not change which profile `yoink current` reports. Your active Claude Code profile is whatever you last switched to globally.

The scope question appears only when Claude Code is being newly ticked. If the provider is already your global Claude Code profile, Claude Code shows as connected in the checklist; switch globally to a Claude account first (`yoink work`), then connect again.

## FAQ

### Can I set up the project scope from a script?

No. The scope question is only part of the interactive checklist. `yoink connect <name> --to claude-code` always connects globally. In a script, write the seven keys into `.claude/settings.local.json` yourself, as OpenRouter's [Claude Code guide](https://openrouter.ai/docs/guides/guides/claude-code-integration) describes.

### Does yoink check whether Claude Code is running in that project?

No. `yoink use` and the global choice in the checklist ask before changing a running Claude Code (a scripted `yoink connect --to claude-code` does not), but the project scope writes the file directly. Restart any Claude Code session in that folder so it reads the new settings.
