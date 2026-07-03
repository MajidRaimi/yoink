import { chmod, rename } from "node:fs/promises";

export const writeFileAtomic = async (path: string, contents: string, mode?: number): Promise<void> => {
  const tmp = `${path}.${process.pid}.tmp`;
  await Bun.write(tmp, contents);
  if (mode !== undefined) await chmod(tmp, mode);
  await rename(tmp, path);
};
