import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "@/components/custom/code-block";
import { Database, KeyRound, RotateCcw, Workflow } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "How it works",
  description: "Keychain snapshots, identity swaps, and managed env overrides.",
  path: "/docs/how-it-works/",
});

const HowItWorksPage = () => (
  <DocsPage
    title="How it works"
    description="The exact files and operations behind a switch. No magic, three moves."
    path="/docs/how-it-works/"
  >
    <DocsSection heading="Where Claude Code keeps your login" icon={KeyRound}>
      <p>
        Claude Code stores OAuth credentials in the macOS Keychain under the service{" "}
        <code>Claude Code-credentials</code>, and your account identity (email, organization) in
        the <code>oauthAccount</code> block of <code>~/.claude.json</code>. A yoink profile is a
        snapshot of both.
      </p>
      <CodeBlock
        prompt
        code={`security find-generic-password -w -s "Claude Code-credentials"`}
      />
    </DocsSection>

    <DocsSection heading="What a switch does" icon={Workflow}>
      <p>
        <strong>1. Re-snapshot.</strong> Claude Code refreshes tokens silently in the background,
        so yoink first reads the live Keychain entry and folds it back into the profile that is
        currently active. A token refreshed five minutes ago is preserved, not clobbered.
      </p>
      <p>
        <strong>2. Write the target.</strong> The target profile&apos;s credential blob goes into
        the Keychain and its <code>oauthAccount</code> block into <code>~/.claude.json</code>,
        preserving the file&apos;s existing indentation.
      </p>
      <p>
        <strong>3. Reconcile the env block.</strong> For a Claude account, the seven managed{" "}
        <code>ANTHROPIC_*</code> keys are stripped from <code>~/.claude/settings.json</code> so
        OAuth wins. For an external provider, they are written. Nothing else in the file changes.
      </p>
    </DocsSection>

    <DocsSection heading="Storage" icon={Database}>
      <p>
        Profiles live in <code>~/.config/yoink/profiles.json</code>, created with{" "}
        <code>chmod 600</code> inside a <code>0700</code> directory. Every write in yoink, the
        profile store, <code>~/.claude.json</code>, and both settings files, is atomic: content
        goes to a temp file first, then a <code>rename</code> replaces the original, so a crash
        mid-write can never leave a truncated file.
      </p>
    </DocsSection>

    <DocsSection heading="Why a restart is needed" icon={RotateCcw}>
      <p>
        A running Claude Code session holds its token in memory and may write it back to the
        Keychain on its next refresh, overwriting what yoink just placed there. yoink detects a
        running session (<code>pgrep -x claude</code>) and asks before switching. Restart Claude
        Code after a switch and it boots from the new credentials.
      </p>
    </DocsSection>
  </DocsPage>
);

export default HowItWorksPage;
