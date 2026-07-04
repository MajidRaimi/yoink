import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "@/components/custom/code-block";
import { Eye, RefreshCw, Settings2, SquareTerminal } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "Usage",
  description: "The command set and how the daily workflows fit together.",
  path: "/docs/usage/",
});

const UsagePage = () => (
  <DocsPage
    title="Usage"
    description="Ten commands, most of which you will never need because the menu covers them."
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
yoink edit work
yoink rename work humain
yoink remove old-account`}
      />
      <p>
        <code>add</code> runs a fresh Claude sign-in or registers an external provider.{" "}
        <code>save</code> snapshots whatever login is currently live under a name you choose.{" "}
        <code>edit</code> renames a Claude profile, or changes any field of an external one (name,
        provider, base URL, API key, model). <code>remove</code> deletes the snapshot only, never
        your live login.
      </p>
    </DocsSection>

    <DocsSection heading="Inspecting state" icon={Eye}>
      <CodeBlock
        prompt
        code={`yoink list
yoink current`}
      />
      <p>
        <code>list</code> prints every profile with its account label; the active one is marked.{" "}
        <code>current</code> prints just the active profile. Profiles live in{" "}
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
