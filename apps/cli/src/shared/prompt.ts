import { confirm, isCancel, type Option, password, select, text } from "@clack/prompts";

type TextOptions = Parameters<typeof text>[0];
type PasswordOptions = Parameters<typeof password>[0];
type ConfirmOptions = Parameters<typeof confirm>[0];
type Validator = NonNullable<TextOptions["validate"]>;

type PromptSelectOptions<T extends string> = {
  message: string;
  options: ReadonlyArray<Option<T>>;
  initialValue?: T;
  maxItems?: number;
};

export const normalizePromptValue = (value: string | undefined): string => value?.trim() ?? "";

const withNormalizedInput = (validate: Validator | undefined): Validator | undefined =>
  validate && ((value) => validate(normalizePromptValue(value)));

export const promptText = async (options: TextOptions): Promise<string | null> => {
  const value = await text({ ...options, validate: withNormalizedInput(options.validate) });
  return isCancel(value) ? null : normalizePromptValue(value);
};

export const promptPassword = async (options: PasswordOptions): Promise<string | null> => {
  const value = await password({ ...options, validate: withNormalizedInput(options.validate) });
  return isCancel(value) ? null : normalizePromptValue(value);
};

export const promptConfirm = async (options: ConfirmOptions): Promise<boolean | null> => {
  const value = await confirm(options);
  return isCancel(value) ? null : value;
};

export const promptSelect = async <const T extends string>(
  options: PromptSelectOptions<T>,
): Promise<T | null> => {
  const value = await select<T>({ ...options, options: [...options.options] });
  return isCancel(value) ? null : value;
};
