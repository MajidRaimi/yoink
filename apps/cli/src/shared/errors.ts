export const errorMessage = (error: unknown, fallback: string = String(error)): string =>
  error instanceof Error ? error.message : fallback;

export class YoinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YoinkError";
  }
}

export class ConfigParseError extends YoinkError {
  constructor(path: string, cause: unknown) {
    super(`Could not parse ${path}: ${errorMessage(cause)}`);
    this.name = "ConfigParseError";
  }
}
