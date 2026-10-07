import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "@/components/custom/code-block";
import Link from "next/link";
import { Eye, Layers, RefreshCw, Settings2, SquareTerminal } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "Usage",
  description: "The command set and how the daily workflows fit together.",
  path: "/docs/usage/",
});

const UsagePage = () => (
  <DocsPage
    title="Usage"
    description="Account switching, plus provider commands that work with or without a terminal UI."
    path="/docs/usage/"
  >
    <DocsSection heading="The two you will actually type" icon={SquareTerminal}>
      <CodeBlock
        prompt
        code={`yoink
yoink <name>`}
      />
      <p>
        Bare <code>yoink</code> opens the interactive menu. <code>yoink &lt;name&gt;</code> skips
        it and switches straight to a saved profile: any argument that is not a known command is
        treated as a profile name.
      </p>
    </DocsSection>

    <DocsSection heading="Managing profiles" icon={Settings2}>
      <CodeBlock
        prompt
        code={`yoink add
yoink save ci-account
yoink save codex-work --tool codex
yoink edit work
yoink rename work humain
yoink remove old-account`}
      />
      <p>
        <code>add</code> runs a fresh Claude, Codex, Kimi, Gemini, or Copilot sign-in, or registers
        an API-key provider. <code>save</code> snapshots whatever login is currently live under a
        name you choose; add <code>--tool</code> for a{" "}
        <Link href="/docs/subscriptions" className="text-brand-text underline-offset-2 hover:underline">
          subscription
        </Link>{" "}
        tool.{" "}
        <code>edit</code> renames a Claude profile, or changes a provider&apos;s harnesses, models,
        id, display name, API key, or endpoints. <code>remove</code> deletes the snapshot only,
        never your live login; a provider is disconnected from every harness first.
      </p>
    </DocsSection>

    <DocsSection heading="Providers across harnesses" icon={Layers}>
      <CodeBlock
        prompt
        code={`yoink connect fuse --to pi,opencode --default claude-sonnet-4-5
yoink disconnect fuse --from opencode
yoink models fuse --set claude-sonnet-4-5,gpt-5.2
yoink harnesses
yoink import`}
      />
      <p>
        <code>connect</code> writes a provider into pi, omp, opencode, codex, or Claude Code, and{" "}
        <code>disconnect</code> takes it out. <code>models</code> changes which models it exposes
        and re-syncs every connected harness. <code>harnesses</code> shows what is installed and
        where its config lives, and <code>import</code> adopts providers you set up by hand. Each
        opens a picker when you leave its flag off. Adding a Claude account needs an interactive
        terminal, but providers can be added from a script with the key on stdin:
      </p>
      <CodeBlock
        prompt
        code={`echo "$KEY" | yoink add --external --name fuse --base-url https://api.fuse.example/v1 \\
  --models claude-sonnet-4-5 --connect pi,omp --token-stdin`}
      />
      <p>
        Every flag is listed under{" "}
        <Link href="/docs/providers" className="text-brand-text underline-offset-2 hover:underline">
          Providers
        </Link>
        .
      </p>
    </DocsSection>

    <DocsSection heading="Inspecting state" icon={Eye}>
      <CodeBlock
        prompt
        code={`yoink list
yoink current
yoink current --tool codex
yoink list --json`}
      />
      <p>
        <code>list</code> prints every profile grouped by tool with its account label; the active
        one in each group is marked. <code>current</code> prints the active profile, or one
        tool&apos;s with <code>--tool</code>, and <code>list --json</code> is for scripts. A
        subscription switch from a script refuses while that tool is running unless you pass{" "}
        <code>--force</code>. Profiles live in{" "}
        <code>~/.config/yoink/profiles.json</code> at chmod 600.
      </p>
    </DocsSection>

    <DocsSection heading="A refreshed token is never lost" icon={RefreshCw}>
      <p>
        Claude Code refreshes its OAuth token silently while you work. Every switch re-snapshots
        the live credential into the active profile before writing the target one, so the
        profile store always holds the newest token for each account. If a Claude Code session is
        running during a switch, Yoink warns you first: a live session can overwrite the token on
        its next refresh.
      </p>
    </DocsSection>
  </DocsPage>
);

export default UsagePage;
