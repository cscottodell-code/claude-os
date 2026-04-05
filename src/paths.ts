import { resolve } from "path";
import { homedir } from "os";

/** Toolkit root directory, resolved from env or default location */
export const TOOLKIT_DIR =
  process.env.SCOTT_TOOLKIT_DIR ??
  resolve(homedir(), "Sites/Global/scott-toolkit");

/** ~/.claude directory */
export const CLAUDE_DIR = resolve(homedir(), ".claude");

/** Resolve a path relative to toolkit root */
export function toolkitPath(...segments: string[]): string {
  return resolve(TOOLKIT_DIR, ...segments);
}

/** Resolve a path relative to ~/.claude */
export function claudePath(...segments: string[]): string {
  return resolve(CLAUDE_DIR, ...segments);
}

/** Resolve a path relative to ~/Sites */
export function sitesPath(...segments: string[]): string {
  return resolve(homedir(), "Sites", ...segments);
}
