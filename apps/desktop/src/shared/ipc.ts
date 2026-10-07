import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  AddProviderInput,
  ExternalInput,
  HarnessId,
  HarnessStatus,
  ProbeInput,
  ProbeResult,
  ProviderPreset,
  Settings,
  Store,
} from "./types";

export const ipc = {
  listProfiles: () => invoke<Store>("list_profiles"),
  switchProfile: (name: string) => invoke<void>("switch_profile", { name }),
  renameProfile: (from: string, to: string) => invoke<void>("rename_profile", { from, to }),
  removeProfile: (name: string) => invoke<void>("remove_profile", { name }),
  saveProfile: (name: string) => invoke<void>("save_profile", { name }),
  addExternal: (input: ExternalInput) => invoke<void>("add_external", { input }),
  editExternal: (name: string, input: ExternalInput) => invoke<void>("edit_external", { name, input }),
  listPresets: () => invoke<ProviderPreset[]>("list_presets"),
  probeProvider: (input: ProbeInput) => invoke<ProbeResult>("probe_provider", { input }),
  providerHarnesses: (name: string) => invoke<HarnessStatus[]>("provider_harnesses", { name }),
  addProvider: (input: AddProviderInput) => invoke<void>("add_provider", { input }),
  connectProvider: (name: string, harnesses: HarnessId[], defaultModel: string | null) =>
    invoke<void>("connect_provider", { name, harnesses, defaultModel }),
  disconnectProvider: (name: string, harnesses: HarnessId[]) =>
    invoke<void>("disconnect_provider", { name, harnesses }),
  setProviderModels: (name: string, models: string[]) => invoke<void>("set_provider_models", { name, models }),
  isClaudeRunning: () => invoke<boolean>("is_claude_running"),
  hidePanel: () => invoke<void>("hide_panel"),
  openLoginTerminal: (cols: number, rows: number) => invoke<void>("open_login_terminal", { cols, rows }),
  writePty: (data: string) => invoke<void>("write_pty", { data }),
  resizePty: (cols: number, rows: number) => invoke<void>("resize_pty", { cols, rows }),
  closeLoginTerminal: () => invoke<void>("close_login_terminal"),
  getSettings: () => invoke<Settings>("get_settings"),
  setHotkey: (accelerator: string) => invoke<void>("set_hotkey", { accelerator }),
  setAutostart: (enabled: boolean) => invoke<void>("set_autostart", { enabled }),
};

export const onProfilesChanged = (handler: (store: Store) => void): Promise<UnlistenFn> =>
  listen<Store>("profiles:changed", (event) => handler(event.payload));

export const onPanelShown = (handler: () => void): Promise<UnlistenFn> =>
  listen("panel:shown", handler);

export const onTerminalOutput = (handler: (data: string) => void): Promise<UnlistenFn> =>
  listen<string>("terminal:output", (event) => handler(event.payload));

export const onTerminalExit = (handler: (code: number) => void): Promise<UnlistenFn> =>
  listen<number>("terminal:exit", (event) => handler(event.payload));
