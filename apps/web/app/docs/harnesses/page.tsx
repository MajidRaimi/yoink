import Link from "next/link";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "@/components/custom/code-block";
import { Archive, Download, Layers, Link2, Server, Star } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "Harnesses",
  description: "What Yoink writes into pi, omp, opencode, codex, and Claude Code.",
  path: "/docs/harnesses/",
});

const harnesses = [
  { id: "pi", config: "~/.pi/agent/models.json", protocols: "chat, responses, messages" },
  { id: "omp", config: "~/.omp/agent/models.yml", protocols: "chat, responses, messages" },
  { id: "opencode", config: "~/.config/opencode/opencode.json", protocols: "chat, messages, responses" },
  { id: "codex", config: "~/.codex/config.toml", protocols: "responses only" },
  { id: "claude-code", config: "~/.claude/settings.json", protocols: "messages only" },
];

const defaults = [
  { id: "pi", where: "defaultProvider + defaultModel in settings.json" },
  { id: "omp", where: "modelRoles.default in config.yml" },
  { id: "opencode", where: "top-level model" },
  { id: "codex", where: "model + model_provider" },
  { id: "claude-code", where: "ANTHROPIC_MODEL and every tier" },
];

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
                <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-brand-text">{row.id}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{row.config}</td>
                <td className="px-4 py-3 text-faint">{row.protocols}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Protocols are listed in each harness&apos;s order of preference; Yoink uses the first one
        the provider supports. pi follows <code>PI_CODING_AGENT_DIR</code>, opencode follows{" "}
        <code>XDG_CONFIG_HOME</code> and edits <code>opencode.jsonc</code> in place (comments
        survive), codex follows <code>CODEX_HOME</code>, and Claude Code follows{" "}
        <code>CLAUDE_CONFIG_DIR</code>. Keys you added to an entry by hand are kept on every
        re-sync.
      </p>
    </DocsSection>

    <DocsSection heading="Default models" icon={Star}>
      <div className="overflow-hidden rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <tbody>
            {defaults.map((row, index) => (
              <tr
                key={row.id}
                className={cn("transition-colors hover:bg-surface", index < defaults.length - 1 && "border-b border-hairline")}
              >
                <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-brand-text">{row.id}</td>
                <td className="px-4 py-3 text-muted">{row.where}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        pi, omp, and opencode reference the model as <code>&lt;provider&gt;/&lt;model&gt;</code>.
        Disconnecting a provider clears any default that pointed at it.
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

    <DocsSection heading="Backups" icon={Archive}>
      <p>
        Before Yoink first changes an existing pi, omp, opencode, or codex config, it copies it to{" "}
        <code>&lt;file&gt;.yoink.bak</code>. The backup is made once and never overwritten, so it
        always holds your config from before Yoink. Every write after that is atomic and{" "}
        <code>0600</code>.
      </p>
    </DocsSection>

    <DocsSection heading="Connect and inspect" icon={Link2}>
      <CodeBlock
        prompt
        code={`yoink connect fuse
yoink connect fuse --to pi,opencode,omp --default claude-sonnet-4-5
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
        skipped. The same key and URL found in several harnesses merge into one provider, which is
        then kept in sync in each of them. The menu offers this once, the first time you open it.
      </p>
    </DocsSection>
  </DocsPage>
);

export default HarnessesPage;
