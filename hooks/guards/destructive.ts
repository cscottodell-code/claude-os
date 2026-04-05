/**
 * Guard: Block hard-to-reverse destructive commands.
 */

import { stripQuoted } from "../lib/stdin.js";
import type { GuardResult } from "./git-push.js";

const PATTERNS: Array<{ regex: RegExp; message: string }> = [
  {
    regex: /rm\s+-rf/,
    message: "rm -rf blocked — confirm destructive deletion.",
  },
  {
    regex: /git\s+reset\s+--hard/,
    message:
      "git reset --hard blocked — confirm loss of uncommitted changes.",
  },
  {
    regex: /git\s+checkout\s+--\s/,
    message: "git checkout -- blocked — confirm discarding changes.",
  },
  {
    regex: /git\s+clean\s+-f/,
    message:
      "git clean -f blocked — confirm deleting untracked files.",
  },
];

export function guardDestructive(command: string): GuardResult {
  const stripped = stripQuoted(command);
  for (const { regex, message } of PATTERNS) {
    if (regex.test(stripped)) {
      return { allow: false, message };
    }
  }
  return { allow: true };
}
