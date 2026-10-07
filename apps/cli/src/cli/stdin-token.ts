import { YoinkError } from "../shared/errors";

export const readTokenFromStdin = async (): Promise<string> => {
  if (process.stdin.isTTY) {
    throw new YoinkError("--token-stdin requires the API key piped on stdin, e.g. echo $KEY | yoink add ...");
  }
  const token = (await Bun.stdin.text()).trim();
  if (!token) throw new YoinkError("No token received on stdin. Pipe the API key when using --token-stdin.");
  return token;
};
