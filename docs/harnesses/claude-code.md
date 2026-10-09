---
title: Use a custom provider in Claude Code
seoTitle: "Claude Code custom API provider: the 7 env keys · Yoink CLI"
description: "What yoink writes into ~/.claude/settings.json to point Claude Code at another Anthropic-compatible API, and how it restores your Claude login after."
nav: Claude Code
order: 5
harness: claude-code
related:
  - docs/guides/claude-code-with-openrouter-kimi-deepseek-zai.md
  - docs/guides/per-project-claude-code-provider.md
  - docs/guides/switch-claude-code-accounts.md
  - docs/providers.md
---

# Use a custom provider in Claude Code

Also at [yoink.codes/harnesses/claude-code/](https://yoink.codes/harnesses/claude-code/).

Claude Code reaches a non-Anthropic backend through environment variables, and yoink sets seven of them in the `env` block of `~/.claude/settings.json`, starting with `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN`. Run `yoink connect <name> --to claude-code --default <model>`; switching back to a saved Claude account strips the seven keys again.

## The seven keys yoink writes

Connecting an OpenRouter key saved as `openrouter` with `--default z-ai/glm-4.7` writes this, with the token redacted:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
    "ANTHROPIC_AUTH_TOKEN": "<your key>",
    "ANTHROPIC_MODEL": "z-ai/glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "z-ai/glm-4.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "z-ai/glm-4.7",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "z-ai/glm-4.7",
    "CLAUDE_CODE_SUBAGENT_MODEL": "z-ai/glm-4.7"
  }
}
```

| Key | What it carries |
| --- | --- |
| `ANTHROPIC_BASE_URL` | the provider's Anthropic Messages endpoint, without `/v1` |
| `ANTHROPIC_AUTH_TOKEN` | your API key |
| `ANTHROPIC_MODEL` | the model Claude Code starts with |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL` | the same model, so picking a tier in Claude Code never falls back to an Anthropic model id |
| `CLAUDE_CODE_SUBAGENT_MODEL` | the same model again, for subagents |

yoink merges these into your existing `env` block and never writes or removes any other key. A `theme`, your permissions, or an unrelated variable such as `DISABLE_TELEMETRY` stay exactly where they were. Claude Code's own [settings documentation](https://code.claude.com/docs/en/settings) explains the `env` block and the order in which settings files apply.

## One backend at a time

pi, opencode and most other harnesses hold many providers side by side. Claude Code holds one. Connecting a provider to it therefore switches your active yoink profile to that provider, exactly like `yoink use <name>` does. Connecting a second provider replaces the seven values; it does not add a second entry.

Claude Code always needs a model. Without `--default`, yoink keeps the last model you used with this provider in Claude Code, or takes the provider's first selected model.

```bash
yoink connect openrouter --to claude-code --default z-ai/glm-4.7
yoink use openrouter
yoink use work
```

The last line switches back to a saved Claude account called `work`: yoink restores that login and strips the seven keys, so your subscription takes over again.

## Which providers work

Claude Code needs an Anthropic Messages endpoint. Five presets have one: `kimi-code`, `moonshot`, `openrouter`, `deepseek` and `zai`. The `openai` and `ollama` presets do not, and yoink stops with a clear error instead of writing a config that cannot work:

```text
✖ Claude Code: "ollama" has no Anthropic-compatible endpoint, which Claude Code requires.
```

A custom gateway works when its `/v1/messages` route answers yoink's probe. The guide to [OpenRouter, Kimi, DeepSeek or z.ai in Claude Code](../guides/claude-code-with-openrouter-kimi-deepseek-zai.md) walks through each of them.

## Disconnect and restore your login

`yoink disconnect openrouter --from claude-code` removes the seven keys, drops the `env` block if nothing else is left in it, and marks the saved Claude profile that matches your live login as active. If the provider was not the active one, there is nothing to undo and the file is not touched.

Claude Code gets no `settings.json.yoink.bak` (Claude Desktop and Goose's provider file don't get one either). yoink only changes these seven keys inside `env`. If you had set any of them yourself, connecting overwrites them and disconnecting removes them.

## Notices and gotchas

- **Config directory.** When `CLAUDE_CONFIG_DIR` is set, yoink writes `settings.json` there instead of `~/.claude`.
- **Settings tracked in git.** Dotfiles repositories often track `~/.claude/settings.json`. yoink refuses to write an API key into a tracked file and names it; the interactive flow asks first, and `yoink connect --allow-tracked` writes it anyway.
- **Claude Code running.** The interactive picker asks before switching while Claude Code is running (default no). A running session keeps the config it loaded, so restart it after any change.
- **One project only.** The interactive picker offers to write the same seven keys into `./.claude/settings.local.json` instead, leaving the global setup alone. See [a different provider for one project](../guides/per-project-claude-code-provider.md).
- **Import.** `yoink import` reads `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_MODEL` from the global file, names the provider after the host, and saves it without making it active.

## FAQ

### Does yoink overwrite the rest of my Claude Code settings.json?

No. It merges the seven managed keys into `env` and writes everything else back unchanged. Disconnecting removes only those seven keys.

### Why do all five model variables get the same model?

Claude Code asks for different tiers (Opus, Sonnet, Haiku, subagents) at different moments. A third-party API usually does not serve Anthropic's model ids, so yoink points every tier at the model you chose. Pick a different one with `yoink connect <name> --to claude-code --default <model>`.
