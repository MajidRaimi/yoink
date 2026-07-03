import { pageMetadata } from "@/lib/seo";
import { Download, ListChecks, Repeat, UserPlus } from "lucide-react";
import { CodeBlock } from "@/components/custom/code-block";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "Getting started",
  description: "Install yoink and switch your first Claude Code account.",
  path: "/docs/getting-started/",
});

const GettingStartedPage = () => (
  <DocsPage
    title="Getting started"
    description="From clone to your first account switch in about two minutes."
    path="/docs/getting-started/"
  >
    <DocsSection heading="Requirements" icon={ListChecks}>
      <p>
        yoink runs on <strong>macOS</strong> only for now: it stores and swaps credentials through
        the login Keychain via the <code>security</code> CLI. The install below ships a single
        self-contained binary, so nothing else is needed.
      </p>
    </DocsSection>

    <DocsSection heading="Install" icon={Download}>
      <p>One command downloads the binary for your Mac and puts it on your PATH:</p>
      <CodeBlock prompt code="curl -fsSL https://yoink.codes/install.sh | bash" />
      <p>
        Prefer npm? The <code>yoink-cli</code> package resolves the right binary for your
        architecture automatically:
      </p>
      <CodeBlock prompt code="npm install -g yoink-cli" />
      <p>Confirm it answers:</p>
      <CodeBlock prompt code="yoink version" />
      <p>
        Building from source instead: clone the repo, run <code>bun install</code>, then{" "}
        <code>cd apps/cli &amp;&amp; bun run build</code> and link{" "}
        <code>dist/yoink</code> onto your PATH.
      </p>
    </DocsSection>

    <DocsSection heading="Add your accounts" icon={UserPlus}>
      <p>
        <code>yoink add</code> drives the whole login. It saves your current account first (so it
        is never lost), then runs <code>claude auth login</code>, which opens the Claude sign-in
        page. Sign in as the account you want to add and yoink captures it as a named profile, then
        offers to add another, so you can register every account in one sitting.
      </p>
      <CodeBlock prompt code="yoink add" />
    </DocsSection>

    <DocsSection heading="Switch" icon={Repeat}>
      <p>Open the interactive menu and pick an account, or jump straight to one by name:</p>
      <CodeBlock
        prompt
        code={`yoink
yoink work`}
      />
      <p>
        Restart Claude Code after switching so it picks up the new credentials. The first time
        yoink touches the Keychain, macOS asks for permission: choose{" "}
        <strong>Always Allow</strong>.
      </p>
    </DocsSection>
  </DocsPage>
);

export default GettingStartedPage;
