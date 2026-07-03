import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "@/components/custom/code-block";
import { Cpu, Globe, PlugZap, Shuffle } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "External providers",
  description: "Run OpenRouter, Ollama, or any Anthropic-compatible API inside Claude Code.",
  path: "/docs/external-providers/",
});

const ExternalProvidersPage = () => (
  <DocsPage
    title="External providers"
    description="Register any Anthropic-compatible endpoint as a switchable profile."
    path="/docs/external-providers/"
  >
    <DocsSection heading="Adding a provider" icon={PlugZap}>
      <p>
        Run <code>yoink add</code> and choose <strong>External provider</strong>. yoink asks for
        three things:
      </p>
      <CodeBlock
        code={`Provider name   OpenRouter
Base URL        https://openrouter.ai/api
API key         sk-or-v1-…`}
      />
      <p>
        It validates the key by fetching <code>{"{baseURL}"}/v1/models</code>. If the endpoint
        answers, you get a <strong>searchable model picker</strong> (OpenRouter alone exposes
        hundreds of models; type a few characters to narrow). The model you pick fills every Claude
        Code model tier: <code>ANTHROPIC_MODEL</code>, the opus/sonnet/haiku defaults, and the
        subagent model.
      </p>
    </DocsSection>

    <DocsSection heading="Global or project scope" icon={Globe}>
      <p>Then yoink asks where the provider should apply:</p>
      <p>
        <strong>Globally</strong> writes the env block into <code>~/.claude/settings.json</code>,
        which makes the provider a switchable profile in the menu like any other account. If that
        file happens to be tracked in a git repo, yoink warns you before a token lands in it.
      </p>
      <p>
        <strong>This project only</strong> writes <code>./.claude/settings.local.json</code>{" "}
        instead, the highest-precedence settings file, and checks that your{" "}
        <code>.gitignore</code> excludes it first, offering to add the entry if it does not. Your
        other projects and the global settings keep using whatever they had.
      </p>
    </DocsSection>

    <DocsSection heading="Switching between kinds" icon={Shuffle}>
      <p>
        The menu treats both account types the same way. Picking an external account writes its env
        block. Picking a Claude account restores the Claude login <strong>and strips</strong> the
        seven managed env keys, so your subscription takes over again. Only those seven keys are
        ever written or removed; hooks, permissions, and the rest of your settings are untouched.
      </p>
    </DocsSection>

    <DocsSection heading="Local models via Ollama" icon={Cpu}>
      <p>
        Ollama exposes an Anthropic-compatible API on localhost, so a local model registers like
        any hosted provider:
      </p>
      <CodeBlock
        code={`Provider name   Ollama
Base URL        http://localhost:11434
API key         ollama`}
      />
      <p>
        Pick the local model from the catalog and pin it to a scratch project with the
        project-only scope: offline Claude Code, no tokens spent.
      </p>
    </DocsSection>
  </DocsPage>
);

export default ExternalProvidersPage;
