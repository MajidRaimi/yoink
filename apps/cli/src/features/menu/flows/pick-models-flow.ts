import { promptMultiSelect, promptSearchMultiSelect } from "../../../shared/prompt";

type ModelChoice = { id: string; name: string };

const SEARCH_THRESHOLD = 12;
const VISIBLE_ROWS = 12;

const toOptions = (models: ModelChoice[]) =>
  models.map((model) => ({
    value: model.id,
    label: model.id,
    hint: model.name && model.name !== model.id ? model.name : undefined,
  }));

export const pickModelSelection = async (
  available: ModelChoice[],
  initialIds: string[] = [],
): Promise<string[] | null> => {
  const options = toOptions(available);
  const initialValues = initialIds.filter((id) => available.some((model) => model.id === id));
  if (available.length > SEARCH_THRESHOLD) {
    return promptSearchMultiSelect({
      message: `Select models (${available.length} available, type to search, space to toggle)`,
      options,
      initialValues,
      maxItems: VISIBLE_ROWS,
      required: true,
      placeholder: "type to filter",
    });
  }
  return promptMultiSelect({ message: "Select models", options, initialValues, required: true });
};
