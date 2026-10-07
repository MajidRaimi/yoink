import Link from "next/link";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "@/components/custom/code-block";
import { Archive, BellRing, Download, FlaskConical, KeyRound, Layers, Link2, Server, Star } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "Harnesses",
  description: "What Yoink writes into pi, opencode, codex, Claude Code, Qwen Code, Zed, and more.",
  path: "/docs/harnesses/",
});

const harnesses = [
  { id: "pi", config: "~/.pi/agent/models.json", protocols: "chat, responses, messages" },
  { id: "omp", config: "~/.omp/agent/models.yml", protocols: "chat, responses, messages" },
  { id: "opencode", config: "~/.config/opencode/opencode.json", protocols: "chat, messages, responses" },
  { id: "codex", config: "~/.codex/config.toml", protocols: "responses only" },
  { id: "claude-code", config: "~/.claude/settings.json", protocols: "messages only" },
  { id: "qwen", config: "~/.qwen/settings.json", protocols: "chat, responses, messages" },
  { id: "kilo", config: "~/.config/kilo/kilo.json", protocols: "chat, messages, responses" },
  { id: "droid", config: "~/.factory/settings.json", protocols: "messages, responses, chat" },
  { id: "crush", config: "~/.config/crush/crush.json", protocols: "chat, messages" },
  { id: "goose", config: "~/.config/goose/custom_providers/", protocols: "chat, messages", experimental: true },
  { id: "zed", config: "~/.config/zed/settings.json", protocols: "chat, responses, messages", experimental: true },
  { id: "continue", config: "~/.continue/config.yaml", protocols: "chat, messages" },
  {
    id: "claude-desktop",
    config: "Claude-3p/configLibrary/yoink-<id>.json",
    protocols: "messages only",
    experimental: true,
  },
];

const defaults = [
  { id: "pi", where: "defaultProvider + defaultModel in settings.json" },
  { id: "omp", where: "modelRoles.default in config.yml" },
  { id: "opencode", where: "top-level model" },
  { id: "codex", where: "model + model_provider" },
  { id: "claude-code", where: "ANTHROPIC_MODEL and every tier" },
  { id: "qwen", where: "model.name + security.auth.selectedType" },
  { id: "kilo", where: "top-level model" },
  { id: "droid", where: "not set, pick the model in Droid" },
  { id: "crush", where: "models.large { provider, model }" },
  { id: "goose", where: "GOOSE_PROVIDER + GOOSE_MODEL in config.yaml" },
  { id: "zed", where: "agent.default_model { provider, model }" },
  { id: "continue", where: "chosen model moves to the top of models" },
  { id: "claude-desktop", where: "first entry of inferenceModels" },
];

const keyHandling = [
  { id: "qwen", how: "env.YOINK_<ID>_API_KEY in settings.json, referenced by each model's envKey" },
  { id: "kilo", how: "literal options.apiKey, same entry as opencode" },
  { id: "droid", how: "literal apiKey on each customModels entry, tagged [<id>] in displayName" },
  { id: "crush", how: "literal api_key, cost fields written as 0" },
  { id: "goose", how: "api_key_env CUSTOM_<ID>_API_KEY; secrets.yaml only when GOOSE_DISABLE_KEYRING is truthy in your environment or config.yaml" },
  { id: "zed", how: "never written; Zed reads <ID>_API_KEY or its own agent settings" },
  { id: "continue", how: "literal apiKey on entries named <model> (<id>)" },
  { id: "claude-desktop", how: "literal inferenceGatewayApiKey in its own file" },
];

const notices = [
  { id: "crush", text: "A crushrc beside crush.json may override what Yoink wrote." },
  {
    id: "goose",
    text: "When Goose uses the OS keyring: export CUSTOM_<ID>_API_KEY, or enter the key once in Goose.",
  },
  { id: "zed", text: "Set <ID>_API_KEY in your environment, or paste the key in Zed's agent settings." },
  {
    id: "claude-desktop",
    text: "Open Claude Desktop, Developer, Configure third-party inference, select yoink-<id>, then relaunch.",
  },
];

type DetailRow = { id: string; detail: string };

const DetailTable = ({ rows }: { rows: readonly DetailRow[] }) => (
  <div className="overflow-hidden rounded-xl border border-hairline">
    <table className="w-full text-sm">
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            className={cn("transition-colors hover:bg-surface", index < rows.length - 1 && "border-b border-hairline")}
          >
            <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-brand-text">{row.id}</td>
            <td className="px-4 py-3 text-muted">{row.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ExperimentalTag = () => (
  <span className="ml-2 rounded-full border border-hairline px-1.5 py-0.5 font-sans text-[10px] text-faint">
    experimental
  </span>
);

const linkClass = "text-brand-text underline-offset-2 hover:underline";

const HarnessesPage = () => (
  <DocsPage
    title="Harnesses"
    description="Every coding agent Yoink keeps in sync, and exactly what it writes into each."
    path="/docs/harnesses/"
  >
    <DocsSection heading="Supported harnesses" icon={Layers}>
      <div className="overflow-hidden rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <tbody>
            {harnesses.map((row, index) => (
              <tr
                key={row.id}
                className={cn("transition-colors hover:bg-surface", index < harnesses.length - 1 && "border-b border-hairline")}
              >
                <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-brand-text">
                  {row.id}
                  {row.experimental && <ExperimentalTag />}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{row.config}</td>
                <td className="px-4 py-3 text-faint">{row.protocols}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Protocols are listed in each harness&apos;s order of preference; Yoink uses the first one
        the provider supports. pi follows <code>PI_CODING_AGENT_DIR</code>, opencode and Kilo Code
        follow <code>XDG_CONFIG_HOME</code> and edit their <code>.jsonc</code> file in place
        (comments survive), codex follows <code>CODEX_HOME</code>, Claude Code follows{" "}
        <code>CLAUDE_CONFIG_DIR</code>, Qwen Code follows <code>QWEN_HOME</code>, Crush follows{" "}
        <code>CRUSH_GLOBAL_CONFIG</code>, Goose follows <code>GOOSE_PATH_ROOT</code>, and Zed
        follows <code>XDG_CONFIG_HOME</code>. Claude Desktop keeps <code>Claude-3p</code> under{" "}
        <code>~/Library/Application Support</code> on macOS, <code>%LOCALAPPDATA%</code> on
        Windows, and <code>~/.config</code> on Linux. Keys you added to an entry by hand are kept on
        every re-sync.
      </p>
    </DocsSection>

    <DocsSection heading="Default models" icon={Star}>
      <DetailTable rows={defaults.map((row) => ({ id: row.id, detail: row.where }))} />
      <p>
        pi, omp, opencode, and Kilo Code reference the model as{" "}
        <code>&lt;provider&gt;/&lt;model&gt;</code>. Disconnecting a provider clears a default only
        when it pointed at that provider.
      </p>
    </DocsSection>

    <DocsSection heading="codex and Claude Code" icon={Server}>
      <p>
        codex talks to custom providers over the OpenAI Responses API only, so it accepts
        providers with an <code>openai-responses</code> endpoint, like the <code>openai</code>{" "}
        preset. Others show <strong>needs an OpenAI Responses endpoint</strong>. Claude Code holds
        one backend at a time: connecting a provider there switches your active profile. See{" "}
        <Link href="/docs/providers" className={linkClass}>
          Providers
        </Link>{" "}
        for the managed env keys and the project-only scope.
      </p>
    </DocsSection>

    <DocsSection heading="Where the key goes" icon={KeyRound}>
      <DetailTable rows={keyHandling.map((row) => ({ id: row.id, detail: row.how }))} />
      <p>
        <code>&lt;ID&gt;</code> is the provider id in upper snake case, so <code>fuse</code> becomes{" "}
        <code>FUSE</code>. Each harness tags the entries Yoink writes (by key, tag, or file name), so
        disconnecting removes only Yoink&apos;s entries for that provider and leaves yours alone.
      </p>
    </DocsSection>

    <DocsSection heading="Experimental harnesses" icon={FlaskConical}>
      <p>
        Goose, Zed, and Claude Desktop are marked experimental. Yoink writes their config, but Goose
        keeps keys in the OS keyring, Zed never reads a key from its settings file, and Claude
        Desktop only switches configs from its own menu. Yoink never touches the keyring, the
        Claude Desktop <code>_meta.json</code>, or managed-preference files, so one step is left
        for you.
      </p>
    </DocsSection>

    <DocsSection heading="Notices after connect" icon={BellRing}>
      <DetailTable rows={notices.map((row) => ({ id: row.id, detail: row.text }))} />
      <p>
        The CLI, the menu, and the desktop app show these under the harness after a successful
        connect. <code>yoink harnesses --json</code> lists them as <code>notices</code>, one per
        connected provider, and <code>yoink status &lt;name&gt; --json</code> includes that
        provider&apos;s <code>notice</code>, both next to an <code>experimental</code> flag.
      </p>
    </DocsSection>

    <DocsSection heading="Backups" icon={Archive}>
      <p>
        Before Yoink first changes an existing harness config other than Claude Code, it copies
        it to{" "}
        <code>&lt;file&gt;.yoink.bak</code>. The backup is made once and never overwritten, so it
        always holds your config from before Yoink. Every write after that is atomic and{" "}
        <code>0600</code>.
      </p>
      <p>
        Goose&apos;s <code>custom_providers/custom_&lt;id&gt;.json</code> and Claude Desktop&apos;s{" "}
        <code>Claude-3p/configLibrary/yoink-&lt;id&gt;.json</code> are owned by Yoink instead: they
        are overwritten without a backup on connect and deleted on disconnect.
      </p>
    </DocsSection>

    <DocsSection heading="Connect and inspect" icon={Link2}>
      <CodeBlock
        prompt
        code={`yoink connect fuse
yoink connect fuse --to pi,opencode,omp --default claude-sonnet-4-5
yoink connect fuse --to qwen,kilo,crush,continue
yoink disconnect fuse --from codex
yoink models fuse --set claude-sonnet-4-5,gpt-5.2
yoink harnesses
yoink harnesses --json`}
      />
      <p>
        Without <code>--to</code>, <code>connect</code> opens a picker with the current harnesses
        pre-checked. Without <code>--from</code>, <code>disconnect</code> removes the provider from
        every harness that holds it. <code>harnesses</code> shows what is installed, which providers
        each one holds, and its config path.
      </p>
    </DocsSection>

    <DocsSection heading="Importing existing providers" icon={Download}>
      <CodeBlock
        prompt
        code={`yoink import
yoink import --yes`}
      />
      <p>
        Already set providers up by hand? <code>import</code> reads every installed harness and
        offers the ones with a literal API key. Entries that point at an env var or a command are
        skipped, so Zed and keyring-backed Goose have nothing to import. The same key and URL found in several harnesses merge into one provider, which is
        then kept in sync in each of them. The menu offers this once, the first time you open it.
      </p>
    </DocsSection>
  </DocsPage>
);

export default HarnessesPage;
