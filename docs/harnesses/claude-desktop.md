---
title: Use a third-party provider in Claude Desktop
seoTitle: "Use a third-party provider in Claude Desktop · Yoink CLI"
description: "yoink writes a Claude-3p configLibrary file with your gateway URL and models. Then select it under Developer, Configure third-party inference."
nav: Claude Desktop
order: 13
harness: claude-desktop
related:
  - docs/providers.md
  - docs/harnesses.md
  - docs/providers/openrouter.md
---

# Use a third-party provider in Claude Desktop

Also at [yoink.codes/harnesses/claude-desktop/](https://yoink.codes/harnesses/claude-desktop/).

Claude Desktop can send its requests to a gateway that speaks the Anthropic Messages API, configured from a library of saved configs. yoink drops one file per provider into that library, `Claude-3p/configLibrary/yoink-<provider>.json`, and stops there: you select it in the app. Run `yoink connect <name> --to claude-desktop`, then finish in Developer, Configure third-party inference.

## What yoink writes

For the OpenRouter preset with `--default z-ai/glm-4.7`, the file holds four keys, key redacted:

```json
{
  "inferenceProvider": "gateway",
  "inferenceGatewayBaseUrl": "https://openrouter.ai/api",
  "inferenceGatewayApiKey": "<your key>",
  "inferenceModels": ["z-ai/glm-4.7"]
}
```

- `inferenceProvider` is always `gateway`, the mode Anthropic's [gateway guide](https://claude.com/docs/third-party/claude-desktop/gateway) describes for self-hosted or third-party endpoints.
- `inferenceGatewayBaseUrl` is the provider's Anthropic endpoint with any trailing `/v1` removed.
- `inferenceModels` lists every model you selected in yoink, as plain ids, with the `--default` model moved to the front. The first entry is what yoink reports as the default.

Because the list holds full model ids, the app has an explicit model list and does not depend on the gateway's `GET /v1/models` to fill its picker; Anthropic's guide notes that when every entry is a full id, the app skips that call.

## Finish in the app

yoink never writes the library's `_meta.json` and never touches managed-preference files, so Claude Desktop does not switch configs on its own. After connecting:

1. Open Claude Desktop.
2. Go to Developer, then Configure third-party inference.
3. Select the `yoink-<provider>` config.
4. Relaunch Claude Desktop.

yoink prints these steps as a notice after every connect. Claude Desktop is one of the three harnesses yoink tags experimental, with Goose and Zed, so read that notice each time.

## Which providers work

Claude Desktop takes Anthropic Messages only. That rules some presets out:

| Preset | Result |
| --- | --- |
| `openrouter`, `kimi-code`, `moonshot`, `deepseek`, `zai` | connect through their Anthropic endpoint |
| `openai`, `ollama` | refused: neither preset has an Anthropic endpoint, so yoink reports "has no endpoint Claude Desktop can use" |

A custom gateway qualifies when its `/v1/messages` probe answered.

```bash
yoink connect openrouter --to claude-desktop --default z-ai/glm-4.7
yoink connect deepseek --to claude-desktop
```

## Not exclusive, unlike Claude Code

Claude Code holds one backend at a time, so connecting a provider there switches your active profile (see [Claude Code is exclusive](../providers.md#claude-code-is-exclusive)). Claude Desktop does not work that way. Each provider gets its own `yoink-<provider>.json`, several can sit in the library together, and connecting one never removes another. Which one is live is the choice you make in the app.

## Where the library lives

| System | Folder |
| --- | --- |
| macOS | `~/Library/Application Support/Claude-3p/configLibrary` |
| Windows | `%LOCALAPPDATA%\Claude-3p\configLibrary` |
| Linux | `~/.config/Claude-3p/configLibrary`, or under `$XDG_CONFIG_HOME` |

yoink counts the app as installed when `/Applications/Claude.app` or the `Claude-3p` folder exists.

## Owned files, no backup

The library files are yoink's own. Each connect overwrites `yoink-<provider>.json` without a backup, keeping any extra keys you added by hand; `yoink disconnect deepseek --from claude-desktop` deletes the file. Do not store a config of your own under a `yoink-` name.

## FAQ

### I connected a provider but Claude Desktop still uses the old one. Why?

yoink only adds the config to the library. Select `yoink-<provider>` under Developer, Configure third-party inference, then relaunch the app.

### Can yoink import a gateway I already set up in Claude Desktop?

Yes, when it is a library file with `inferenceProvider` set to `gateway` (or unset), a base URL and a literal `inferenceGatewayApiKey`. The provider id is taken from the file name, minus any `yoink-` prefix.
