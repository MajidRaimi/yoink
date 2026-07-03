# yoink

Switch between Claude Code accounts from your terminal, fast.

`yoink` snapshots the OAuth credentials Claude Code stores in your macOS Keychain (plus the matching account identity in `~/.claude.json`) into named profiles, then swaps them in and out on demand. No browser re-login.

## Install

Requires [Bun](https://bun.sh) and macOS.

```bash
bun install
bun run build
ln -sf "$PWD/dist/yoink" ~/.local/bin/yoink
```

## Usage

```bash
yoink                 # open the interactive account menu
yoink <name>          # switch straight to a saved profile
yoink add             # add an account: Claude sign-in, or an external provider
yoink edit <name>     # edit a profile (name, or provider/URL/key/model)
yoink save <name>     # snapshot your current login as a profile
yoink use <name>      # switch to a saved profile
yoink list            # list all saved profiles
yoink current         # show the active profile
yoink rename <a> <b>  # rename a profile
yoink remove <name>   # delete a profile
```

### Adding accounts

`yoink add` drives the whole login for you: it first saves your current account (so it is never lost), then runs `claude auth login`, which opens the Claude sign-in page. Sign in as the account you want to add and `yoink` captures it as a new profile. It then offers to add another, so you can register every account in one sitting.

```bash
yoink add            # sign in as account A -> name it "work"
                     # "Add another account?" -> yes -> sign in as account B -> name it "personal"

# now hop between them instantly:
yoink personal
yoink work
```

The interactive menu (`yoink` with no arguments) is a keyboard-driven list of your accounts. Move with the arrow keys (or `j`/`k`), and:

- `Enter` switches to the highlighted account
- `n` adds a new account (Claude sign-in or an external provider)
- `e` edits the highlighted profile (rename a Claude account; change name/provider/base URL/API key/model for an external one)
- `s` saves your current login as a profile
- `d` deletes the highlighted profile (after a confirm)
- `q` / `Esc` / `Ctrl-C` quits

Editing an external account re-applies the change to live settings where it's in force: `~/.claude/settings.json` if it's the active account, or this project's `./.claude/settings.local.json` if you run the edit from a directory pinned to that account. Otherwise the profile is updated and applied the next time you switch to it.

Actions loop back to the list, so you can switch, add, and prune in one sitting and quit with `q` when you're done.

### External providers

`yoink add` also registers any Anthropic-compatible provider (OpenRouter, and similar). Choose **External provider** and answer:

1. **Provider name** (a label, e.g. `OpenRouter`)
2. **Base URL** (e.g. `https://openrouter.ai/api`)
3. **API key**

yoink validates the key by fetching the provider's model list from `${baseURL}/v1/models`, then gives you a **searchable** picker (handy when a provider exposes hundreds of models). The model you pick fills every Claude Code model tier (`ANTHROPIC_MODEL`, opus/sonnet/haiku, and the subagent model).

Then it asks where to apply it:

- **Globally** writes the provider's `env` block into `~/.claude/settings.json`, so the account is switchable from the yoink menu like any other. yoink only ever touches the seven `ANTHROPIC_*` / `CLAUDE_CODE_SUBAGENT_MODEL` keys and leaves the rest of your settings untouched. If that file is tracked in a git repo, yoink warns you first, since the token would live there in plaintext.
- **This project only** writes `./.claude/settings.local.json` (the file Claude Code treats as personal and highest-precedence) and ensures your `.gitignore` excludes it before writing, so your key can't be committed.

Switching handles the two account types transparently: picking an external account writes its `env` block; picking a Claude account restores the Keychain login **and strips** the external `env` block so your subscription takes over again.

## How it works

Claude Code keeps your login in the macOS Keychain under the service `Claude Code-credentials`. A profile stores that credential blob together with the `oauthAccount` identity block from `~/.claude.json`.

Switching does three things:

1. Re-snapshots your currently active profile from the live Keychain first, so a token Claude Code silently refreshed in the background is never lost.
2. Writes the target profile's credential blob back into the Keychain.
3. Restores the target profile's account identity into `~/.claude.json`.

Profiles live in `~/.config/yoink/profiles.json` (`chmod 600`). Restart Claude Code after switching to pick up the new account.

## Notes

- **Keychain prompt:** the first time `yoink` reads or writes the credential, macOS may ask for permission. Choose *Always Allow*.
- **Running sessions:** if Claude Code is running when you switch, `yoink` warns you, since a live session can overwrite the token on its next refresh.
- macOS only for now (it depends on the `security` Keychain CLI).
