import { note } from "@clack/prompts";
import pc from "picocolors";
import { theme } from "../../shared/theme";
import { promptSelect, promptText } from "../../shared/prompt";
import type { ProviderModel } from "./types";

const SEARCH_AGAIN = "__search_again__";
const SEARCH_THRESHOLD = 12;
const MAX_VISIBLE = 40;
const VISIBLE_ROWS = 12;

const filterModels = (models: ProviderModel[], term: string): ProviderModel[] =>
  models.filter(
    (model) => model.id.toLowerCase().includes(term) || model.name.toLowerCase().includes(term),
  );

const matchOrAll = (models: ProviderModel[], term: string): ProviderModel[] => {
  const matches = filterModels(models, term);
  if (matches.length > 0) return matches;
  note(theme.warn(`No models match "${term}". Showing all.`), "Search");
  return models;
};

const toModelOptions = (pool: ProviderModel[]) => {
  const capped = pool.slice(0, MAX_VISIBLE);
  const options = capped.map((model) => ({
    value: model.id,
    label: model.id,
    hint: model.name && model.name !== model.id ? model.name : "",
  }));
  if (pool.length > capped.length) {
    options.push({
      value: SEARCH_AGAIN,
      label: pc.dim(`… ${pool.length - capped.length} more (search to narrow)`),
      hint: "",
    });
  }
  return options;
};

export const pickModel = async (models: ProviderModel[]): Promise<ProviderModel | null> => {
  let pool = models;
  for (;;) {
    if (pool.length > SEARCH_THRESHOLD) {
      const query = await promptText({
        message: `Search ${pool.length} models`,
        placeholder: "type to filter, or leave empty to browse",
      });
      if (query === null) return null;
      const term = query.toLowerCase();
      pool = term.length === 0 ? models : matchOrAll(models, term);
    }

    const choice = await promptSelect({
      message: "Select a model",
      options: toModelOptions(pool),
      maxItems: VISIBLE_ROWS,
    });
    if (choice === null) return null;
    if (choice === SEARCH_AGAIN) {
      pool = models;
      continue;
    }
    return models.find((model) => model.id === choice) ?? null;
  }
};
