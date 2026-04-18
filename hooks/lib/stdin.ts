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

/** Result of reading stdin: parsed input, empty (no data), or error (had data but couldn't parse) */
export type StdinResult =
  | { ok: true; input: HookInput }
  | { ok: true; input: null }   // empty stdin, not a failure
  | { ok: false; raw: string }; // had data but parse failed

/** Read all stdin data using process.stdin (works in both Bun and Node). */
function collectStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      process.stdin.removeAllListeners();
      process.stdin.destroy();
      resolve('');
    }, 3000);
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve('');
    });
    process.stdin.resume();
  });
}

/** Read and parse JSON from stdin. Distinguishes "no input" from "parse failure". */
export async function readStdin(): Promise<StdinResult> {
  try {
    const text = await collectStdin();
    if (!text.trim()) return { ok: true, input: null };
    return { ok: true, input: JSON.parse(text) as HookInput };
  } catch {
    return { ok: false, raw: "(parse error)" };
  }
}

/** Convenience: read stdin and return just the input (null on empty or error). Legacy compat. */
export async function readStdinSimple(): Promise<HookInput | null> {
  const result = await readStdin();
  if (!result.ok) return null;
  return result.input;
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
