import { promptText } from "../../../shared/prompt";

export type NameConflict = (name: string) => string | undefined;

export const promptProfileName = async (
  initialValue: string,
  conflict: NameConflict = () => undefined,
): Promise<string | null> =>
  promptText({
    message: "Name this profile",
    initialValue,
    validate: (value) => (value.trim().length === 0 ? "A name is required" : conflict(value.trim())),
  });
