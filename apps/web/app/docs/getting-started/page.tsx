import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { Download, ListChecks, Repeat, UserPlus } from "lucide-react";
import { CodeBlock } from "@/components/custom/code-block";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "Getting started",
  description: "Install Yoink and switch your first Claude Code account.",
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
        Yoink runs on <strong>macOS</strong> (Apple Silicon and Intel), <strong>Linux</strong>{" "}
        (x64 and arm64, glibc and musl/Alpine), and <strong>Windows</strong> (x64 and arm64). On macOS it stores and swaps
        credentials through the login Keychain via the <code>security</code> CLI; on Linux and
        Windows it works against Claude Code&apos;s credentials file. Every install ships a single
        self-contained binary, so nothing else is needed.
      </p>
    </DocsSection>

    <DocsSection heading="Install" icon={Download}>
      <p>
        Grab Yoink from the{" "}
        <Link href="/download" className="text-brand-text underline-offset-2 hover:underline">
          download page
        </Link>
        : the macOS menu bar app, or the CLI one-liner for macOS, Linux, and Windows. The short
        version on macOS and Linux:
      </p>
      <CodeBlock prompt code={site.installCommand} />
      <p>Confirm it answers:</p>
      <CodeBlock prompt code="yoink version" />
    </DocsSection>

    <DocsSection heading="Add your accounts" icon={UserPlus}>
      <p>
        <code>yoink add</code> drives the whole login. It saves your current account first (so it
        is never lost), then runs <code>claude auth login</code>, which opens the Claude sign-in
        page. Sign in as the account you want to add and Yoink captures it as a named profile, then
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
        Restart Claude Code after switching so it picks up the new credentials. On macOS, the
        first time Yoink touches the Keychain the system asks for permission: choose{" "}
        <strong>Always Allow</strong>.
      </p>
    </DocsSection>
  </DocsPage>
);

export default GettingStartedPage;
