import { resolve } from "path";
import { homedir } from "os";

export const TOOLKIT_DIR =
  process.env.CLAUDE_OS_DIR ??
  resolve(homedir(), "Scott/claude-os");

export const CLAUDE_DIR = resolve(homedir(), ".claude");

export function toolkitPath(...segments: string[]): string {
  return resolve(TOOLKIT_DIR, ...segments);
}

export function claudePath(...segments: string[]): string {
  return resolve(CLAUDE_DIR, ...segments);
}
