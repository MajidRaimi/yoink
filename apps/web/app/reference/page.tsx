import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { Kbd } from "@/components/custom/kbd";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";
import { Files, Keyboard, Terminal } from "lucide-react";
import { CommandTable } from "./_components/command-table";

export const metadata = pageMetadata({
  title: "CLI reference",
  description: "Every yoink command, alias, argument, and the menu keymap.",
  path: "/reference/",
});

const files = [
  { path: "~/.config/yoink/profiles.json", role: "profile store, chmod 600" },
  { path: "Keychain · Claude Code-credentials", role: "the OAuth credential blob on macOS" },
  { path: "~/.claude/.credentials.json", role: "the OAuth credential blob on Linux and Windows" },
  { path: "~/.claude.json", role: "oauthAccount identity block" },
  { path: "~/.claude/settings.json", role: "global env overrides (7 managed keys)" },
  { path: "./.claude/settings.local.json", role: "project-scoped env overrides" },
];

const ReferencePage = () => (
  <DocsPage title="CLI reference" description="The complete surface of the yoink binary." path="/reference/">
    <DocsSection heading="Commands" icon={Terminal}>
      <CommandTable />
      <p>
        Any argument that is not a recognized command is treated as a profile name, so{" "}
        <code>yoink work</code> and <code>yoink use work</code> are the same call.
      </p>
    </DocsSection>

    <DocsSection heading="Menu keymap" icon={Keyboard}>
      <p className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="flex items-center gap-2">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <Kbd>j</Kbd>
          <Kbd>k</Kbd> move
        </span>
        <span className="flex items-center gap-2">
          <Kbd>↵</Kbd> switch
        </span>
        <span className="flex items-center gap-2">
          <Kbd>n</Kbd> new
        </span>
        <span className="flex items-center gap-2">
          <Kbd>e</Kbd> edit
        </span>
        <span className="flex items-center gap-2">
          <Kbd>s</Kbd> save
        </span>
        <span className="flex items-center gap-2">
          <Kbd>d</Kbd> delete
        </span>
        <span className="flex items-center gap-2">
          <Kbd>q</Kbd> quit
        </span>
      </p>
    </DocsSection>

    <DocsSection heading="Files yoink touches" icon={Files}>
      <div className="overflow-hidden rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <tbody>
            {files.map((file, index) => (
              <tr
                key={file.path}
                className={cn("transition-colors hover:bg-surface", index < files.length - 1 && "border-b border-hairline")}
              >
                <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-brand-text">
                  {file.path}
                </td>
                <td className="px-4 py-3 text-muted">{file.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Every write is atomic (temp file + rename). Only the seven managed env keys are ever added
        to or removed from a settings file.
      </p>
    </DocsSection>
  </DocsPage>
);

export default ReferencePage;
