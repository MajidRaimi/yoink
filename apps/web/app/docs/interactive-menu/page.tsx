import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { Kbd } from "@/components/custom/kbd";
import { TerminalWindow } from "@/components/custom/terminal-window";
import { Keyboard, List, SquarePen } from "lucide-react";
import { DocsPage, DocsSection } from "@/components/custom/docs-page";

export const metadata = pageMetadata({
  title: "Interactive menu",
  description: "The keyboard-driven account list and its keymap.",
  path: "/docs/interactive-menu/",
});

const keymap = [
  { keys: ["↑", "↓"], alt: ["j", "k"], action: "Move between accounts" },
  { keys: ["↵"], action: "Switch to the highlighted account" },
  { keys: ["n"], action: "Add a new account (Claude sign-in or external provider)" },
  { keys: ["e"], action: "Edit the highlighted profile" },
  { keys: ["s"], action: "Save your current login as a profile" },
  { keys: ["d"], action: "Delete the highlighted profile, after a confirm" },
  { keys: ["q"], alt: ["Esc", "Ctrl-C"], action: "Quit" },
];

const InteractiveMenuPage = () => (
  <DocsPage
    title="Interactive menu"
    description="Bare yoink opens a lazygit-style list. Every account action is one key away."
    path="/docs/interactive-menu/"
  >
    <DocsSection heading="The list" icon={List}>
      <TerminalWindow title="yoink">
        <div className="flex gap-3 leading-[1.9]">
          <div
            aria-hidden
            className="my-[0.95em] ml-0.5 w-3 shrink-0 self-stretch border-t border-b border-l border-faint"
          />
          <div className="min-w-0">
            <p>
              <span className="rounded-md bg-brand px-2 py-1 font-bold text-on-brand">yoink</span>
              <span className="text-muted"> switch Claude accounts</span>
            </p>
            <p aria-hidden>&nbsp;</p>
            <p>
              <span className="font-medium text-green-600 dark:text-green-400">● work</span>
              <span className="text-faint">
                {" "}
                (<bdi>work@company.com</bdi>)
              </span>
            </p>
            <p>
              <span className="text-faint">○</span>
              <span className="text-muted"> personal</span>
              <span className="text-faint">
                {" "}
                (<bdi>me@personal.dev</bdi>)
              </span>
            </p>
            <p>
              <span className="text-faint">○</span>
              <span className="text-muted"> openrouter</span>
              <span className="text-faint">
                {" "}
                (OpenRouter · <bdi>z-ai/glm-4.7</bdi>)
              </span>
            </p>
            <p aria-hidden>&nbsp;</p>
            <p className="text-muted">↑↓ move ↵ switch n new e edit s save d delete q quit</p>
          </div>
        </div>
      </TerminalWindow>
      <p>
        The active account renders green. Actions loop back to the list, so you can add, prune, and
        switch in one sitting, then leave with <Kbd>q</Kbd>.
      </p>
    </DocsSection>

    <DocsSection heading="Keymap" icon={Keyboard}>
      <div className="overflow-hidden rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <tbody>
            {keymap.map((row, index) => (
              <tr
                key={row.action}
                className={cn("transition-colors hover:bg-surface", index < keymap.length - 1 && "border-b border-hairline")}
              >
                <td className="w-40 px-4 py-3">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {row.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                    {row.alt?.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocsSection>

    <DocsSection heading="Editing from the menu" icon={SquarePen}>
      <p>
        <Kbd>e</Kbd> adapts to the profile type. A Claude account has one editable field, its name
        (the credentials come from a real login, not from you). An external account opens a field
        picker: name, provider, base URL, API key, and model, where changing the model re-fetches
        the provider&apos;s catalog through the searchable picker. Editing the currently active
        external account re-applies the change to live settings immediately.
      </p>
    </DocsSection>
  </DocsPage>
);

export default InteractiveMenuPage;
