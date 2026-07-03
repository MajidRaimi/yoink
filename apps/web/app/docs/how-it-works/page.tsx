import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "@/components/custom/code-block";
import { Database, KeyRound, RotateCcw, Workflow } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "How it works",
  description: "Credential snapshots, identity swaps, and managed env overrides.",
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
        On macOS, Claude Code stores OAuth credentials in the Keychain under the service{" "}
        <code>Claude Code-credentials</code>. On Linux and Windows, the same credential blob lives
        in a plaintext file at <code>~/.claude/.credentials.json</code>. On every platform, your
        account identity (email, organization) sits in the <code>oauthAccount</code> block of{" "}
        <code>~/.claude.json</code>. A yoink profile is a snapshot of both. If{" "}
        <code>CLAUDE_CONFIG_DIR</code> is set, yoink follows it for these files, matching Claude
        Code.
      </p>
      <CodeBlock
        prompt
        code={`security find-generic-password -w -s "Claude Code-credentials"`}
      />
    </DocsSection>

    <DocsSection heading="What a switch does" icon={Workflow}>
      <p>
        <strong>1. Re-snapshot.</strong> Claude Code refreshes tokens silently in the background,
        so yoink first reads the live credential and folds it back into the profile that is
        currently active. A token refreshed five minutes ago is preserved, not clobbered.
      </p>
      <p>
        <strong>2. Write the target.</strong> The target profile&apos;s credential blob goes into
        the Keychain entry on macOS or <code>.credentials.json</code> elsewhere, and its{" "}
        <code>oauthAccount</code> block into <code>~/.claude.json</code>, preserving the
        file&apos;s existing indentation.
      </p>
      <p>
        <strong>3. Reconcile the env block.</strong> For a Claude account, the seven managed{" "}
        <code>ANTHROPIC_*</code> keys are stripped from <code>~/.claude/settings.json</code> so
        OAuth wins. For an external provider, they are written. Nothing else in the file changes.
      </p>
    </DocsSection>

    <DocsSection heading="Storage" icon={Database}>
      <p>
        Profiles live in <code>~/.config/yoink/profiles.json</code> on every OS, created with{" "}
        <code>chmod 600</code> inside a <code>0700</code> directory on POSIX. The credentials file
        keeps owner-only permissions too: <code>0600</code> on Linux, and on Windows it inherits
        your user profile&apos;s ACLs, the same protection Claude Code itself applies. On macOS the
        credential never touches a file: it stays in the Keychain.
        Every write in yoink, the profile store, the credentials file, <code>~/.claude.json</code>,
        and both settings files, is atomic: content goes to a temp file first, then a{" "}
        <code>rename</code> replaces the original, so a crash mid-write can never leave a
        truncated file.
      </p>
    </DocsSection>

    <DocsSection heading="Why a restart is needed" icon={RotateCcw}>
      <p>
        A running Claude Code session holds its token in memory and may write it back to the
        credential store on its next refresh, overwriting what yoink just placed there. yoink
        detects a running session (<code>pgrep</code> on macOS and Linux, <code>tasklist</code> on
        Windows) and asks before switching. Restart Claude Code after a switch and it boots from
        the new credentials.
      </p>
    </DocsSection>
  </DocsPage>
);

export default HowItWorksPage;
