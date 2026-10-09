export type LedgerEntry = {
  path: string;
  what: string;
  mode: string;
};

export const LEDGER: readonly LedgerEntry[] = [
  { path: "~/.config/yoink/profiles.json", what: "Saved Claude logins and providers", mode: "0600" },
  { path: "~/.config/yoink/subscriptions.json", what: "Codex, Kimi, Gemini and Copilot snapshots", mode: "0600" },
  { path: "Keychain: Claude Code-credentials", what: "Live Claude Code login on macOS", mode: "security CLI" },
  { path: "~/.claude/.credentials.json", what: "Live Claude Code login on Linux (0600) and Windows (user ACLs)", mode: "owner-only" },
  { path: "~/.claude.json", what: "The oauthAccount identity block", mode: "atomic" },
  { path: "~/.claude/settings.json", what: "The managed env block for a provider", mode: "7 keys" },
  { path: "./.claude/settings.local.json", what: "The same env block for one project only", mode: "7 keys" },
  { path: "./.gitignore", what: "Offers to ignore settings.local.json first", mode: "asks" },
  { path: "Harness configs", what: "Provider entries for pi, omp, opencode, codex and the other harnesses", mode: "atomic" },
  { path: "<harness config>.yoink.bak", what: "Backup before the first change", mode: "once" },
  { path: "~/.codex/auth.json", what: "Live Codex login, rewritten only when you switch Codex", mode: "on switch" },
  { path: "~/.kimi-code/credentials/", what: "Live Kimi login, rewritten only when you switch Kimi", mode: "on switch" },
  { path: "~/.gemini/oauth_creds.json", what: "Live Gemini login, rewritten only when you switch Gemini", mode: "on switch" },
  { path: "~/.gemini/google_accounts.json", what: "Active Google account for Gemini, rewritten only when you switch Gemini", mode: "on switch" },
  { path: "~/.copilot/config.json", what: "Live Copilot login, rewritten only when you switch Copilot", mode: "on switch" },
  { path: "Keychain: Codex Auth", what: "Live Codex login on macOS when Codex uses the keyring", mode: "on switch" },
  { path: "~/.config/yoink/cache/models-dev.json", what: "Cached models.dev catalog, refreshed daily", mode: "cache" },
];
