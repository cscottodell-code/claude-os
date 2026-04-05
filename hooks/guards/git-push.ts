/**
 * Guard: Block git push commands.
 * SECURITY: Fail-closed — if input is unparseable, block.
 */

import { stripQuoted } from "../lib/stdin.js";

export interface GuardResult {
  allow: boolean;
  message?: string;
}

export function guardGitPush(
  command: string | null,
  rawInput: string
): GuardResult {
  // Fail closed: if we can't determine the command, block if there was input
  if (!command) {
    if (rawInput) {
      return {
        allow: false,
        message:
          "guard-git-push: failed to parse input — blocking (fail-closed).",
      };
    }
    return { allow: true };
  }

  const stripped = stripQuoted(command);
  if (/git\s+push/.test(stripped)) {
    return {
      allow: false,
      message:
        "Git push blocked — use /scott:bypass or confirm manually.",
    };
  }

  return { allow: true };
}
