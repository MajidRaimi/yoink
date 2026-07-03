export class YoinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YoinkError";
  }
}
