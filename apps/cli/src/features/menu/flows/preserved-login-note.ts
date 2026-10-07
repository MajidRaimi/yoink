import pc from "picocolors";
import { theme } from "../../../shared/theme";
import { accountLabel } from "../../profiles/format";
import type { Profile } from "../../profiles/types";

export const preservedLoginNote = (profile: Profile): string =>
  `Saved current login as ${theme.accent(profile.name)} ${pc.dim(`(${accountLabel(profile)})`)}. Rename it anytime with \`yoink rename\`.`;
