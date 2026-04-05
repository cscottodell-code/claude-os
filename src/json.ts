import { readFile, writeFile } from "fs/promises";

/** Read and parse a JSON file. Returns null if file doesn't exist or is invalid. */
export async function readJson<T = unknown>(
  path: string
): Promise<T | null> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/** Write an object to a JSON file with 2-space indentation. */
export async function writeJson(
  path: string,
  data: unknown
): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/** Read JSON, returning a default value if the file doesn't exist. */
export async function readJsonOr<T>(
  path: string,
  defaultValue: T
): Promise<T> {
  const result = await readJson<T>(path);
  return result ?? defaultValue;
}
