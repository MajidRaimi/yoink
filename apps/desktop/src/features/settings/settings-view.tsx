import { useViewStore } from "@/shared/view-store";
import { useSettings } from "./use-settings";
import { useAppVersion } from "./use-app-version";

const rowDelay = (index: number) => ({ animationDelay: `${Math.min(index * 25, 200)}ms` });

const BackChevron = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M10 3L5 8L10 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HotkeyChips = ({ hotkey }: { hotkey: string }) => (
  <span className="flex items-center gap-1">
    {hotkey.split("+").map((key) => (
      <kbd
        key={key}
        className="rounded border border-hairline-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-foreground"
      >
        {key}
      </kbd>
    ))}
  </span>
);

const Toggle = ({ checked, onToggle }: { checked: boolean; onToggle: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    data-checked={checked ? "" : undefined}
    onClick={onToggle}
    className="group relative h-5 w-9 shrink-0 rounded-full bg-surface-3 transition-colors data-checked:bg-brand"
  >
    <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-foreground transition-transform duration-200 group-data-checked:translate-x-4 group-data-checked:bg-on-brand" />
  </button>
);

export const SettingsView = () => {
  const setView = useViewStore((state) => state.setView);
  const { settings, error, recording, startRecording, setAutostart } = useSettings();
  const version = useAppVersion();

  return (
    <div className="rise flex h-full flex-col p-3">
      <header className="mb-3 flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label="Back"
          onClick={() => setView("list")}
          className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <BackChevron />
        </button>
        <h1 className="font-mono text-[13px] text-foreground">Settings</h1>
      </header>

      {settings && (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          <section
            style={rowDelay(0)}
            className={`rise rounded-lg border bg-surface p-3 transition-colors ${
              recording ? "border-brand" : "border-hairline"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-foreground">Global shortcut</p>
                <p className="mt-0.5 text-[11px] text-faint">Toggle the Yoink panel from anywhere</p>
              </div>
              <div className="flex items-center gap-2">
                <HotkeyChips hotkey={settings.hotkey} />
                {!recording && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="rounded-full border border-hairline-strong bg-surface px-4 py-1.5 text-[13px] transition-colors hover:border-brand"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
            {recording && (
              <p className="mt-2 font-mono text-[11px] text-brand-text">
                Press the new shortcut, Esc to cancel
              </p>
            )}
          </section>

          <section
            style={rowDelay(1)}
            className="rise flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface p-3"
          >
            <div>
              <p className="text-[13px] text-foreground">Launch at login</p>
              <p className="mt-0.5 text-[11px] text-faint">Start Yoink when you log in to your Mac</p>
            </div>
            <Toggle checked={settings.autostart} onToggle={() => void setAutostart(!settings.autostart)} />
          </section>

          <section style={rowDelay(2)} className="rise mt-auto rounded-lg border border-hairline bg-surface p-3">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[13px] text-foreground">Yoink</p>
              <p className="font-mono text-[11px] text-faint">{version}</p>
            </div>
            <p className="mt-1 text-[11px] text-faint">Updates install automatically from GitHub releases</p>
            <a
              href="https://yoink.codes"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block font-mono text-[11px] text-brand-text transition-opacity hover:opacity-80"
            >
              yoink.codes
            </a>
          </section>
        </div>
      )}

      {error && <p className="mt-2 shrink-0 font-mono text-[11px] text-[#f87171]">{error}</p>}
    </div>
  );
};
