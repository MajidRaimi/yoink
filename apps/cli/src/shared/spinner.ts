import { spinner } from "@clack/prompts";
import { errorMessage } from "./errors";
import { theme } from "./theme";

export type SpinnerFailureHandler = (message: string) => void;

export const withSpinner = async <T,>(
  message: string,
  task: () => Promise<T>,
  onError: SpinnerFailureHandler,
  fallback = "Something went wrong.",
): Promise<T | null> => {
  const loader = spinner();
  loader.start(message);
  try {
    const result = await task();
    loader.stop(message);
    return result;
  } catch (error) {
    loader.stop(theme.error(message));
    onError(errorMessage(error, fallback));
    return null;
  }
};
