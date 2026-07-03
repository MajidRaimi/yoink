import { promptText } from "../../../shared/prompt";

export const promptProfileName = async (initialValue: string): Promise<string | null> =>
  promptText({
    message: "Name this profile",
    initialValue,
    validate: (value) => (value.trim().length === 0 ? "A name is required" : undefined),
  });
