import type { AccountAdapter } from "@/features/demos/linked/types";
import { withClaudeAccount, type MenuState } from "@/features/demos/menu/machine";

export const menuAccountAdapter: AccountAdapter<MenuState> = {
  read: (state) => state.current,
  write: withClaudeAccount,
};
