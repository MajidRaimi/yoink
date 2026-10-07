import Link from "next/link";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "@/components/custom/code-block";
import { Globe, KeyRound, ListChecks, PlugZap, Radar, RefreshCw, Terminal } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "Providers",
  description: "Add an API key once and use it in pi, omp, opencode, codex, and Claude Code.",
  path: "/docs/providers/",
});

const presets = [
  { id: "openai", label: "OpenAI", protocols: "openai-responses, openai-chat" },
  { id: "kimi-code", label: "Kimi Code", protocols: "openai-chat, anthropic-messages" },
  { id: "moonshot", label: "Moonshot AI", protocols: "openai-chat, anthropic-messages" },
  { id: "openrouter", label: "OpenRouter", protocols: "openai-chat, anthropic-messages" },
  { id: "deepseek", label: "DeepSeek", protocols: "openai-chat, anthropic-messages" },
  { id: "zai", label: "Z.ai", protocols: "openai-chat, anthropic-messages" },
  { id: "ollama", label: "Ollama (local)", protocols: "openai-chat" },
];

const addFlags = [
  { flag: "--name <id>", does: "Profile id, also the provider id in harness configs. Required." },
  { flag: "--preset <id>", does: "Use a preset's endpoints instead of a base URL." },
  { flag: "--base-url <url>", does: "Custom provider URL, probed unless --protocol is given." },
  { flag: "--protocol <p,...>", does: "Skip probing: openai-chat, openai-responses, anthropic-messages." },
  { flag: "--provider <label>", does: "Display name. Defaults to the preset label or the id." },
  { flag: "--models <m,...>", does: "Models to expose. Required." },
  { flag: "--connect <h,...>", does: "Connect right away: pi, omp, opencode, codex, claude-code." },
  { flag: "--default <m>", does: "Default model in the connected harnesses." },
  { flag: "--token-stdin", does: "Read the API key from stdin. Required." },
];

const linkClass = "text-brand-text underline-offset-2 hover:underline";

const ProvidersPage = () => (
  <DocsPage
    title="Providers"
    description="Add an API key once and Yoink writes it into every harness you connect."
    path="/docs/providers/"
  >
    <DocsSection heading="Adding a provider" icon={PlugZap}>
      <p>
        Run <code>yoink add</code> and choose <strong>Provider (API key)</strong>. Pick a preset or{" "}
        <strong>Custom</strong>, paste the key, select models from the provider&apos;s live list,
        confirm a profile id (the id harness configs use), then tick the harnesses to connect.
      </p>
      <CodeBlock prompt code="yoink add" />
      <div className="overflow-hidden rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <tbody>
            {presets.map((preset, index) => (
              <tr
                key={preset.id}
                className={cn("transition-colors hover:bg-surface", index < presets.length - 1 && "border-b border-hairline")}
              >
                <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-brand-text">{preset.id}</td>
                <td className="px-4 py-3 text-muted">{preset.label}</td>
                <td className="px-4 py-3 font-mono text-xs text-faint">{preset.protocols}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocsSection>

    <DocsSection heading="Custom providers" icon={Radar}>
      <p>
        For a gateway like Fuse, a self-hosted proxy, or anything else, give a display name and a
        base URL. Yoink lists models from <code>/v1/models</code>, then sends a one-token{" "}
        <code>ping</code> to <code>/v1/messages</code>, <code>/chat/completions</code>, and{" "}
        <code>/responses</code>. Every protocol that answers becomes an endpoint, and the endpoints
        decide which harnesses the provider can join: codex needs OpenAI Responses, Claude Code
        needs Anthropic Messages, and pi, omp, and opencode take any of the three.
      </p>
      <p>
        Paste whichever URL the provider documents: trailing paths like{" "}
        <code>/chat/completions</code> are stripped and <code>/v1</code> is normalized. A 401 or 403
        on every probe means the key was rejected.
      </p>
    </DocsSection>

    <DocsSection heading="Models and models.dev" icon={ListChecks}>
      <p>
        Select as many models as you want; lists longer than twelve get a search box. Each one is
        looked up on <a href="https://models.dev" className={linkClass}>models.dev</a> for its
        context window, output limit, reasoning, and image support, which pi, omp, and opencode
        need. Unknown models get safe defaults (128k context, 32k output). The catalog is cached
        in <code>~/.config/yoink/cache/models-dev.json</code> and refreshed daily.
      </p>
      <CodeBlock
        prompt
        code={`yoink models fuse
yoink models fuse --set claude-sonnet-4-5,gpt-5.2`}
      />
    </DocsSection>

    <DocsSection heading="Keys and re-sync" icon={KeyRound}>
      <p>
        The key lives in <code>~/.config/yoink/profiles.json</code> at chmod 600 and is written as
        a literal into each connected harness config, atomically and with <code>0600</code>{" "}
        permissions. The first time Yoink changes an existing harness file it keeps the original as{" "}
        <code>&lt;file&gt;.yoink.bak</code>.
      </p>
      <p>
        <code>yoink edit &lt;name&gt;</code> opens a field picker: harnesses, models, profile id,
        display name, API key, and endpoints. Any change is re-written into every connected
        harness, so a rotated key reaches all of them at once. Renames move the entry, and{" "}
        <code>yoink remove</code> disconnects everywhere before it deletes the profile.
      </p>
    </DocsSection>

    <DocsSection heading="Claude Code is exclusive" icon={RefreshCw}>
      <p>
        The other harnesses hold many providers side by side. Claude Code holds one backend, so
        connecting a provider there switches the active profile, like <code>yoink use</code>, and
        writes seven managed env keys into <code>~/.claude/settings.json</code>. The chosen model
        fills <code>ANTHROPIC_MODEL</code>, the opus, sonnet, and haiku defaults, and the subagent
        model. Switching to a Claude account strips those keys again; nothing else in the file is
        ever touched.
      </p>
    </DocsSection>

    <DocsSection heading="This project only" icon={Globe}>
      <p>
        From the interactive harness picker, Claude Code asks <strong>Globally</strong> or{" "}
        <strong>This project only</strong>. The project scope writes the same keys into{" "}
        <code>./.claude/settings.local.json</code>, the highest-precedence settings file, after
        checking that <code>.gitignore</code> excludes it and offering to add the entry. Your
        global setup keeps whatever it had.
      </p>
    </DocsSection>

    <DocsSection heading="Scripted add" icon={Terminal}>
      <p>Every provider step works without a terminal UI. The key always comes in on stdin:</p>
      <CodeBlock
        prompt
        code={`echo "$FUSE_API_KEY" | yoink add --external --name fuse --provider Fuse \\
  --base-url https://api.fuse.example/v1 --models claude-sonnet-4-5,gpt-5.2 \\
  --connect pi,opencode,omp --default claude-sonnet-4-5 --token-stdin`}
      />
      <div className="overflow-hidden rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <tbody>
            {addFlags.map((row, index) => (
              <tr
                key={row.flag}
                className={cn("transition-colors hover:bg-surface", index < addFlags.length - 1 && "border-b border-hairline")}
              >
                <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-brand-text">{row.flag}</td>
                <td className="px-4 py-3 text-muted">{row.does}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The original single-model form, <code>--provider --base-url --model</code> without{" "}
        <code>--models</code>, still adds a Claude Code provider and is what the desktop app uses.
        See{" "}
        <Link href="/docs/harnesses" className={linkClass}>
          Harnesses
        </Link>{" "}
        for what lands in each config.
      </p>
    </DocsSection>
  </DocsPage>
);

export default ProvidersPage;
