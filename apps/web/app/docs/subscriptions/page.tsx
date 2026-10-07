import Link from "next/link";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "@/components/custom/code-block";
import { ArrowLeftRight, Info, KeyRound, ShieldCheck, SquareTerminal } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "Subscriptions",
  description: "Save and switch ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot logins.",
  path: "/docs/subscriptions/",
});

const tools = [
  { id: "codex", name: "ChatGPT (Codex)", swaps: "auth.json, or the Codex Auth Keychain entry", login: "codex login" },
  { id: "kimi", name: "Kimi Code", swaps: "credentials/*.json", login: "kimi login" },
  { id: "gemini", name: "Gemini", swaps: "oauth_creds.json, google_accounts.json", login: "gemini, then /auth" },
  { id: "copilot", name: "GitHub Copilot", swaps: "last_logged_in_user in config.json", login: "copilot login" },
];

const linkClass = "text-brand-text underline-offset-2 hover:underline";

const SubscriptionsPage = () => (
  <DocsPage
    title="Subscriptions"
    description="Subscription logins beyond Claude, each switched inside its own tool and never copied into another."
    path="/docs/subscriptions/"
  >
    <DocsSection heading="Supported tools" icon={KeyRound}>
      <div className="overflow-x-auto rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <tbody>
            {tools.map((row, index) => (
              <tr
                key={row.id}
                className={cn("transition-colors hover:bg-surface", index < tools.length - 1 && "border-b border-hairline")}
              >
                <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-brand-text">{row.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{row.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{row.swaps}</td>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-faint">{row.login}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Codex follows <code>CODEX_HOME</code>, Kimi follows <code>KIMI_CODE_HOME</code>, Gemini
        follows <code>GEMINI_CLI_HOME</code>, and Copilot follows <code>COPILOT_HOME</code>. The
        identity Yoink shows (email and plan, Kimi user id, Google account, GitHub login) is read
        locally from those files, with no network call, and never contains a token.
      </p>
    </DocsSection>

    <DocsSection heading="Commands" icon={SquareTerminal}>
      <CodeBlock
        prompt
        code={`yoink add
yoink save codex-work --tool codex
yoink use codex-work
yoink use codex-work --force
yoink list
yoink current --tool kimi
yoink list --json`}
      />
      <p>
        <code>add</code> lists the four tools next to Claude and providers: it saves the current
        login if no profile holds it, runs the tool&apos;s login in your terminal, captures the new
        login, and asks for a name. <code>save --tool</code> snapshots the live login.{" "}
        <code>use</code> routes by profile type, so a subscription profile switches only its own
        tool. <code>list</code> groups profiles by tool, <code>current --tool</code> shows one
        tool, and <code>list --json</code> prints <code>name</code>, <code>type</code>,{" "}
        <code>label</code>, and <code>current</code> without secrets.
      </p>
    </DocsSection>

    <DocsSection heading="What a switch does" icon={ArrowLeftRight}>
      <p>
        If the tool is running, it could write its old login back on the next refresh. In a
        terminal Yoink asks first (default no); from a script it refuses unless you pass{" "}
        <code>--force</code>. Yoink then re-captures the live login into the tool&apos;s active
        profile, but only when the identity matches, restores the target files atomically at{" "}
        <code>0600</code> (then any keyring entry), and rolls back to the previous login if
        anything fails. Claude Code and the other tools are left alone.
      </p>
    </DocsSection>

    <DocsSection heading="Per-tool notes" icon={Info}>
      <p>
        <strong>Codex</strong> stores its login in the keyring when{" "}
        <code>cli_auth_credentials_store</code> says so. Yoink switches the macOS Keychain entry,
        but refuses on Linux, where the Secret Service is not supported yet. Use{" "}
        <code>cli_auth_credentials_store = &quot;file&quot;</code> there.
      </p>
      <p>
        <strong>Kimi Code</strong> will not add a second account while one is signed in, so Yoink
        saves the current credentials, then moves them aside before <code>kimi login</code>.
      </p>
      <p>
        <strong>Gemini</strong> has no login command: Yoink starts <code>gemini</code>, you run{" "}
        <code>/auth</code>, sign in, and exit. Encrypted storage (
        <code>GEMINI_FORCE_ENCRYPTED_FILE_STORAGE=true</code> or{" "}
        <code>gemini-credentials.json</code>) is refused.
      </p>
      <p>
        <strong>GitHub Copilot</strong> keeps a token per user itself, so <code>copilot login</code>{" "}
        adds accounts and a switch only rewrites <code>last_logged_in_user</code>, keeping every
        other key. Yoink warns when <code>COPILOT_GITHUB_TOKEN</code>, <code>GH_TOKEN</code>, or{" "}
        <code>GITHUB_TOKEN</code> overrides the stored login.
      </p>
    </DocsSection>

    <DocsSection heading="Nothing crosses over" icon={ShieldCheck}>
      <p>
        Snapshots live in <code>~/.config/yoink/subscriptions.json</code> at <code>0600</code>, next
        to <code>profiles.json</code>. A subscription token is only ever written back into the tool it came
        from, never into a harness config or another tool. API keys are a separate thing: see{" "}
        <Link href="/docs/providers" className={linkClass}>
          Providers
        </Link>
        .
      </p>
    </DocsSection>
  </DocsPage>
);

export default SubscriptionsPage;
