/**
 * Guard: git-push (RETIRED v6.2.1)
 *
 * Previously blocked all git push commands unconditionally.
 * Removed because Claude Code's built-in permission system already prompts
 * the user before executing any Bash command, making this guard redundant.
 * The behavior rule in claude-behavior.md still instructs Claude to never
 * push autonomously — only when Scott explicitly asks.
 *
 * This file is kept as a no-op so the import in pretooluse-router.ts
 * doesn't break. The router no longer calls it.
 */

export interface GuardResult {
  allow: boolean;
  message?: string;
}

export function guardGitPush(
  _command: string | null,
  _rawInput: string
): GuardResult {
  return { allow: true };
}
