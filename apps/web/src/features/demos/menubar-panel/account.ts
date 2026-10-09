import type { AccountAdapter } from "@/features/demos/linked/types";
import { withClaudeAccount, type PanelState } from "@/features/demos/menubar-panel/machine";

export const panelAccountAdapter: AccountAdapter<PanelState> = {
  read: (state) => state.current,
  write: withClaudeAccount,
};
