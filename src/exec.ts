/** Result of a shell command execution */
export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  ok: boolean;
}

/** Run a shell command with optional timeout (default 30s) */
export async function exec(
  command: string | string[],
  options: { timeout?: number; cwd?: string } = {}
): Promise<ExecResult> {
  const { timeout = 30_000, cwd } = options;
  const args =
    typeof command === "string" ? ["bash", "-c", command] : command;

  const proc = Bun.spawn(args, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  // Timeout handling
  const timer =
    timeout > 0 ? setTimeout(() => proc.kill(), timeout) : null;

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;
  if (timer) clearTimeout(timer);

  return {
    stdout: stdout.trimEnd(),
    stderr: stderr.trimEnd(),
    exitCode,
    ok: exitCode === 0,
  };
}

/** Run a command and return stdout, or null on failure */
export async function execOk(
  command: string,
  options?: { timeout?: number; cwd?: string }
): Promise<string | null> {
  const result = await exec(command, options);
  return result.ok ? result.stdout : null;
}
