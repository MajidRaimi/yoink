<div align="center">

<img src="https://raw.githubusercontent.com/MajidRaimi/yoink/main/docs/assets/banner.png" alt="yoink" width="820" />

<h1>yoink</h1>

<p><strong>Switch between Claude Code accounts from your terminal, fast.</strong></p>

<p>
<a href="https://www.npmjs.com/package/yoink-cli"><img src="https://img.shields.io/npm/v/yoink-cli?color=facc15&labelColor=0a0908&logo=npm&logoColor=white" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/yoink-cli"><img src="https://img.shields.io/npm/dm/yoink-cli?color=facc15&labelColor=0a0908" alt="npm downloads" /></a>
<a href="https://github.com/MajidRaimi/yoink/stargazers"><img src="https://img.shields.io/github/stars/MajidRaimi/yoink?color=facc15&labelColor=0a0908&logo=github&logoColor=white" alt="GitHub stars" /></a>
<img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-0a0908?logoColor=white" alt="macOS | Linux | Windows" />
<a href="https://github.com/MajidRaimi/yoink/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/yoink-cli?color=facc15&labelColor=0a0908" alt="MIT license" /></a>
</p>

<p>
<a href="https://yoink.codes"><strong>Website</strong></a> &nbsp;·&nbsp;
<a href="https://yoink.codes/docs/getting-started/"><strong>Docs</strong></a> &nbsp;·&nbsp;
<a href="https://github.com/MajidRaimi/yoink"><strong>GitHub</strong></a>
</p>

</div>

---

`yoink` snapshots the OAuth credentials Claude Code stores on your machine (the Keychain on macOS, the `~/.claude/.credentials.json` file on Linux and Windows, plus the matching account identity in `~/.claude.json`) into named profiles, then swaps them in and out in a keystroke. It also registers OpenRouter, Ollama, or any Anthropic-compatible provider as a switchable profile. No browser, no re-login.

## Install

macOS and Linux, one command:

```bash
curl -fsSL https://yoink.codes/install.sh | bash
```

Windows:

```powershell
powershell -c "irm https://yoink.codes/install.ps1 | iex"
```

Or with npm, on any OS with Node:

```bash
npm install -g yoink-cli
```

Confirm it answers:

```bash
yoink version
```

## Quick start

```bash
yoink add        # sign in as account A, name it "work"
                 # "Add another?" > yes > sign in as account B, name it "personal"

yoink personal   # switch to personal
yoink work       # switch back
```

Run `yoink` with no arguments for the interactive menu: arrow keys or `j`/`k` to move, `↵` to switch, `n` new, `e` edit, `s` save, `d` delete, `q` to quit. Restart Claude Code after a switch.

## Commands

| Command | Aliases | What it does |
| --- | --- | --- |
| `yoink` | | Open the interactive account menu |
| `yoink <name>` | | Switch straight to a saved profile |
| `yoink add` | `login` | Add an account: Claude sign-in or an external provider |
| `yoink edit <name>` | | Edit a profile (name, or provider / URL / key / model) |
| `yoink save <name>` | | Snapshot the current login as a profile |
| `yoink use <name>` | `switch` | Switch to a saved profile |
| `yoink list` | `ls` | List all saved profiles |
| `yoink current` | `who` | Show the active profile |
| `yoink rename <a> <b>` | | Rename a profile |
| `yoink remove <name>` | `rm` | Delete a profile |
| `yoink version` | `-v` | Print the version |
| `yoink help` | `-h` | Print help |

## Requirements

The package ships prebuilt binaries for macOS (arm64 and x64), Linux (x64 and arm64, glibc and musl/Alpine), and Windows (x64 and arm64) via platform packages, so nothing else is needed. On bare Alpine, run `apk add libstdc++ libgcc` once (the same runtime libraries Node needs there).

## Documentation

Full guides are at [yoink.codes](https://yoink.codes) and in the [GitHub docs](https://github.com/MajidRaimi/yoink/tree/main/docs).

## License

[MIT](https://github.com/MajidRaimi/yoink/blob/main/LICENSE) © Majid Raimi
