import { useCallback, useEffect, useState } from "react";
import { ipc } from "@/shared/ipc";
import type { Settings } from "@/shared/types";

const modifierKeys = new Set(["Meta", "Control", "Alt", "Shift"]);

const namedKeys: Record<string, string> = {
  " ": "Space",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Enter: "Enter",
  Tab: "Tab",
  Backspace: "Backspace",
  Delete: "Delete",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
};

const keyFromEvent = (event: KeyboardEvent): string | null => {
  if (event.code.startsWith("Key")) return event.code.slice(3);
  if (event.code.startsWith("Digit")) return event.code.slice(5);
  const named = namedKeys[event.key];
  if (named) return named;
  if (/^F\d{1,2}$/.test(event.key)) return event.key;
  if (event.key.length === 1) return event.key.toUpperCase();
  return null;
};

const acceleratorFromEvent = (event: KeyboardEvent): string | null => {
  if (modifierKeys.has(event.key)) return null;
  const modifiers = [
    event.metaKey ? "Cmd" : null,
    event.ctrlKey ? "Ctrl" : null,
    event.altKey ? "Alt" : null,
    event.shiftKey ? "Shift" : null,
  ].filter((modifier): modifier is string => modifier !== null);
  if (modifiers.length === 0) return null;
  const key = keyFromEvent(event);
  if (!key) return null;
  return [...modifiers, key].join("+");
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ipc
      .getSettings()
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch(() => {
        if (active) setError("Failed to load settings");
      });
    return () => {
      active = false;
    };
  }, []);

  const setAutostart = useCallback(
    async (enabled: boolean) => {
      if (!settings) return;
      const previous = settings;
      setError(null);
      setSettings({ ...settings, autostart: enabled });
      try {
        await ipc.setAutostart(enabled);
      } catch {
        setSettings(previous);
        setError("Failed to update launch at login");
      }
    },
    [settings],
  );

  const setHotkey = useCallback(
    async (accelerator: string) => {
      if (!settings) return;
      const previous = settings;
      setError(null);
      setSettings({ ...settings, hotkey: accelerator });
      try {
        await ipc.setHotkey(accelerator);
      } catch {
        setSettings(previous);
        setError("Failed to register shortcut");
      }
    },
    [settings],
  );

  useEffect(() => {
    if (!recording) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") {
        setRecording(false);
        return;
      }
      const accelerator = acceleratorFromEvent(event);
      if (!accelerator) return;
      setRecording(false);
      void setHotkey(accelerator);
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [recording, setHotkey]);

  const startRecording = useCallback(() => {
    setError(null);
    setRecording(true);
  }, []);

  const cancelRecording = useCallback(() => setRecording(false), []);

  return { settings, error, recording, startRecording, cancelRecording, setAutostart, setHotkey };
};
