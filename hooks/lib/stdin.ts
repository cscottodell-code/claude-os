/**
 * Shared stdin reading for Claude Code hooks.
 * All hooks receive JSON on stdin describing the tool invocation.
 */

export interface HookInput {
  tool_name?: string;
  tool_input?: {
    command?: string;
    file_path?: string;
    path?: string;
    content?: string;
  };
  tool_output?: string;
}

/** Read and parse JSON from stdin. Returns null on failure. */
export async function readStdin(): Promise<HookInput | null> {
  try {
    const text = await Bun.stdin.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as HookInput;
  } catch {
    return null;
  }
}

/** Get the file path from hook input (handles both field names) */
export function getFilePath(input: HookInput): string | null {
  return input.tool_input?.file_path ?? input.tool_input?.path ?? null;
}

/** Get the command from hook input */
export function getCommand(input: HookInput): string | null {
  return input.tool_input?.command ?? null;
}

/** Strip quoted strings from a command to prevent false positives */
export function stripQuoted(command: string): string {
  return command.replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "");
}
