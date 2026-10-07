import { useState, type ReactElement } from "react";
import { ExternalForm } from "@/features/profiles/external-form";
import { HarnessChecklist } from "@/features/providers/harness-checklist";
import { ProviderWizard } from "@/features/providers/provider-wizard";
import { ProfileList } from "@/features/profiles/profile-list";
import { useSaveCurrentForm } from "@/features/profiles/save-current-form";
import { SettingsView } from "@/features/settings/settings-view";
import { LoginTerminal } from "@/features/terminal/login-terminal";
import { IconButton } from "@/shared/ui/button";
import { GearIcon, PlusIcon, YoinkGlyph } from "@/shared/ui/icons";
import { Kbd } from "@/shared/ui/kbd";
import { useViewStore, type View } from "@/shared/view-store";

const AddMenu = () => {
  const [open, setOpen] = useState(false);
  const setView = useViewStore((state) => state.setView);
  const openProviderWizard = useViewStore((state) => state.openProviderWizard);
  const showSaveForm = useSaveCurrentForm((state) => state.show);

  const items = [
    { label: "Add Claude account", action: () => setView("login") },
    { label: "Add provider", action: () => openProviderWizard() },
    {
      label: "Save current login",
      action: () => {
        setView("list");
        showSaveForm();
      },
    },
  ];

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative">
      <IconButton label="Add profile" onClick={() => setOpen((prev) => !prev)}>
        <PlusIcon />
      </IconButton>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="rise absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-hairline-strong bg-glass-strong p-1 backdrop-blur-sm">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className="block w-full rounded-lg px-2.5 py-1.5 text-left font-mono text-[12px] text-foreground transition-colors hover:bg-surface-2"
                onClick={() => choose(item.action)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Header = () => {
  const setView = useViewStore((state) => state.setView);
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-hairline py-2 pr-2.5 pl-3.5">
      <div className="flex items-center gap-2">
        <YoinkGlyph size={16} className="text-brand" />
        <span className="font-mono text-[13px] text-foreground">Yoink</span>
      </div>
      <div className="flex items-center gap-0.5">
        <AddMenu />
        <IconButton label="Settings" onClick={() => setView("settings")}>
          <GearIcon />
        </IconButton>
      </div>
    </header>
  );
};

type Hint = { keys: readonly string[]; label: string };

const FOOTER_HINTS: Record<View, readonly Hint[]> = {
  list: [
    { keys: ["↑", "↓"], label: "navigate" },
    { keys: ["↵"], label: "open" },
    { keys: ["esc"], label: "close" },
  ],
  harnesses: [
    { keys: ["↑", "↓"], label: "navigate" },
    { keys: ["space"], label: "toggle" },
    { keys: ["esc"], label: "back" },
  ],
  "provider-wizard": [
    { keys: ["↵"], label: "select" },
    { keys: ["⌘↵"], label: "continue" },
    { keys: ["esc"], label: "back" },
  ],
  external: [
    { keys: ["↵"], label: "save" },
    { keys: ["esc"], label: "back" },
  ],
  settings: [{ keys: ["esc"], label: "close" }],
  login: [{ keys: ["esc"], label: "close" }],
};

const Footer = () => {
  const view = useViewStore((state) => state.view);
  return (
    <footer className="flex shrink-0 items-center gap-3 border-t border-hairline px-3.5 py-2 font-mono text-[11px] text-faint">
      {FOOTER_HINTS[view].map((hint) => (
        <span key={hint.label} className="flex items-center gap-1.5">
          <span className="flex items-center gap-0.5">
            {hint.keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </span>
          {hint.label}
        </span>
      ))}
    </footer>
  );
};

export const App = (): ReactElement => {
  const view = useViewStore((state) => state.view);
  return (
    <main className="relative flex h-full flex-col">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col">
        {view === "list" && <ProfileList />}
        {view === "settings" && <SettingsView />}
        {view === "login" && <LoginTerminal />}
        {view === "external" && <ExternalForm />}
        {view === "provider-wizard" && <ProviderWizard />}
        {view === "harnesses" && <HarnessChecklist />}
      </div>
      <Footer />
    </main>
  );
};
