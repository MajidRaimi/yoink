# External providers

`yoink add` can register a Claude account or any Anthropic-compatible endpoint. Pick **External provider** at the prompt to point Claude Code at a non-Anthropic backend while keeping the same switch, list, and menu workflow you use for Claude logins.

Providers shown on [yoink.codes](https://yoink.codes) include Anthropic, OpenRouter, Ollama, z.ai, DeepSeek, and Moonshot. Any endpoint that speaks the Anthropic API and serves `/v1/models` works.

## Registering a provider

Run `yoink add` (alias `yoink login`) in an interactive terminal and choose **External provider**. yoink asks three things:

1. **Provider name** the label this profile shows in `list` and the menu.
2. **Base URL** the API root, for example `https://openrouter.ai/api`.
3. **API key** the token yoink sends when talking to the endpoint.

```bash
yoink add
```

### Validation and model selection

yoink validates the key by calling `${baseURL}/v1/models`. If the request succeeds, it presents a searchable model picker built from the returned list. Type to filter, then select one model. The chosen model fills every Claude Code model tier, so Opus, Sonnet, and Haiku requests all route to the same model.

## Where to apply

After you pick a model, yoink asks where to write the configuration.

### Globally

Writes the managed env block into `~/.claude/settings.json`. This provider becomes a profile you can switch to from the interactive menu or with `yoink use <name>`.

If `~/.claude/settings.json` is tracked by git, yoink warns first, because the API token would be committed in plaintext.

### This project only

Writes the managed env block into `./.claude/settings.local.json`, which has the highest precedence in Claude Code. Before writing, yoink ensures `./.gitignore` excludes `.claude/settings.local.json` so the token is never committed.

## Managed environment keys

yoink only ever writes or strips these seven keys. It does not touch any other environment configuration:

- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- `CLAUDE_CODE_SUBAGENT_MODEL`

## Switching back to a Claude account

When you switch to a Claude profile, yoink restores that account's Claude login and strips the external env block it wrote. Your Claude Code sessions return to the standard Anthropic backend with no leftover provider configuration.

## Editing a provider

Use `yoink edit <name>` to change an external profile's name, provider, base URL, API key, or model. For a Claude account, `edit` only renames the profile.

Restart Claude Code after switching so it picks up the new configuration.
