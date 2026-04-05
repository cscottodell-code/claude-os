import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

/** Read and parse a JSON file. Returns null if file doesn't exist. Logs and returns null if JSON is corrupted. */
export async function readJson<T = unknown>(
  path: string
): Promise<T | null> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    // Distinguish "file missing" (silent) from "file corrupted" (loud)
    if (existsSync(path)) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[toolkit] JSON parse error in ${path}: ${msg}`);
    }
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
