import {
  autocompleteMultiselect,
  confirm,
  isCancel,
  multiselect,
  type Option,
  password,
  select,
  text,
} from "@clack/prompts";

export type Validator = (value: string) => string | undefined;

type TextOptions = Omit<Parameters<typeof text>[0], "validate"> & { validate?: Validator };
type PasswordOptions = Omit<Parameters<typeof password>[0], "validate"> & { validate?: Validator };
type ConfirmOptions = Parameters<typeof confirm>[0];

type PromptSelectOptions<T extends string> = {
  message: string;
  options: ReadonlyArray<Option<T>>;
  initialValue?: T;
  maxItems?: number;
};

export const normalizePromptValue = (value: string | undefined): string => value?.trim() ?? "";

const withNormalizedInput = (validate: Validator | undefined) =>
  validate && ((value: string | undefined) => validate(normalizePromptValue(value)));

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

type PromptMultiSelectOptions<T extends string> = {
  message: string;
  options: ReadonlyArray<Option<T>>;
  initialValues?: T[];
  maxItems?: number;
  required?: boolean;
};

export const promptMultiSelect = async <const T extends string>(
  options: PromptMultiSelectOptions<T>,
): Promise<T[] | null> => {
  const value = await multiselect<T>({ ...options, options: [...options.options] });
  return isCancel(value) ? null : value;
};

export const promptSearchMultiSelect = async <const T extends string>(
  options: PromptMultiSelectOptions<T> & { placeholder?: string },
): Promise<T[] | null> => {
  const value = await autocompleteMultiselect<T>({ ...options, options: [...options.options] });
  return isCancel(value) ? null : value;
};
