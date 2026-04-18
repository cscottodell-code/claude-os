#!/usr/bin/env node --experimental-strip-types --no-warnings
/**
 * pretooluse-router.ts — Consolidated PreToolUse dispatcher for Bash commands.
 * Replaces bash-pretooluse-router.sh + 6 subprocess spawns.
 *
 * Reads stdin once, dispatches to guard functions by pattern.
 * Exit 2 = block, Exit 0 = allow.
 */

import { appendFile } from "fs/promises";
import { resolve } from "path";
import { homedir } from "os";
import { execFileSync } from "child_process";
import { readStdin, getCommand, getFilePath, stripQuoted } from "./lib/stdin.js";
// guardGitPush retired in v6.2.1 — Claude Code's permission prompt is the safety net
import { guardDestructive } from "./guards/destructive.js";
import { guardNpmInstall } from "./guards/npm-install.js";
import { guardPhaseCompletion } from "./guards/phase-completion.js";
import { guardSurrealdbInject } from "./guards/surrealdb-inject.js";
import { guardLessonsInject } from "./guards/lessons-inject.js";
import {
  guardSurrealTestAdvisory,
  guardSurrealPhaseComplete,
} from "./guards/surrealdb-integration-tests.js";

async function main() {
  const stdinResult = await readStdin();

  // Fail open on stdin parse: a broken pipe isn't a security threat,
  // it's broken plumbing. Guards only matter when we CAN read the command.
  if (!stdinResult.ok) {
    process.exit(0);
  }

  const input = stdinResult.input;
  const command = input ? getCommand(input) : null;
  const filePath = input ? getFilePath(input) : null;
  const rawInput = input ? JSON.stringify(input) : "";

  // No input at all (empty stdin) — not a Bash tool, allow
  if (!input) {
    process.exit(0);
  }

  // Log the command
  if (command) {
    const logFile = resolve(homedir(), ".claude/bash-commands.log");
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    await appendFile(logFile, `[${timestamp}] ${command}\n`).catch(
      () => {}
    );
  }

  const stripped = command ? stripQuoted(command) : "";

  // --- Guard 1: git push (RETIRED v6.2.1) ---
  // Previously blocked all git push commands unconditionally.
  // Removed: Claude Code's built-in permission prompt already gates Bash commands.
  // Behavior rule in claude-behavior.md instructs Claude to only push when asked.

  // --- Guard 2: destructive operations ---
  if (
    command &&
    /rm\s+-rf|git\s+reset\s+--hard|git\s+checkout\s+--\s|git\s+clean\s+-f/.test(
      stripped
    )
  ) {
    const result = guardDestructive(command);
    if (!result.allow) {
      if (result.message) console.error(result.message);
      process.exit(2);
    }
  }

  // --- Guard 3: npm/pnpm/bun install ---
  if (
    command &&
    /(?:npm|pnpm|bun)\s+(?:install|add|i\s)/.test(stripped)
  ) {
    const result = guardNpmInstall(command);
    if (!result.allow) {
      if (result.message) console.error(result.message);
      process.exit(2);
    }
  }

  // --- Guard 4: phase completion ---
  if (command && /phase.*(complete|done|finish)/.test(command)) {
    const result = guardPhaseCompletion(command);
    if (!result.allow) {
      if (result.message) console.error(result.message);
      process.exit(2);
    }
    // Also check SurrealDB integration test requirement (blocking)
    const surrealResult = guardSurrealPhaseComplete(stripped, process.cwd());
    if (!surrealResult.allow) {
      if (surrealResult.message) console.error(surrealResult.message);
      process.exit(2);
    }
  }

  // --- Guard 5: git commit validation (GSD-owned) ---
  if (command && /(?:^|\s|&&|\|)git\s+commit/.test(stripped)) {
    const gsdHook = resolve(
      homedir(),
      ".claude/hooks/gsd-validate-commit.sh"
    );
    try {
      execFileSync("bash", [gsdHook], {
        input: rawInput,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 5000,
      });
    } catch (err: any) {
      if (err.status && err.status !== 0) {
        const stdout = err.stdout?.toString().trim();
        if (stdout) console.error(stdout);
        process.exit(err.status);
      }
      // GSD hook not available or timed out, allow
    }
  }

  // Guard 6 (workflow gates) retired 2026-04-18: regex /phase.6/i over-matched
  // legitimate GSD "execute-phase 6" commands, blocking Bash silently with
  // "No stderr output". The scott:new-project skill tracks its own phase
  // markers; PreToolUse enforcement caused more false positives than it caught.

  // --- Guard 7a: SurrealDB integration test warning (advisory, non-blocking) ---
  if (command && /vitest|npx\s+test|pnpm\s+test/.test(stripped)) {
    const surrealTestResult = guardSurrealTestAdvisory(stripped, process.cwd());
    if (surrealTestResult.additionalContext) {
      console.log(
        JSON.stringify({ additionalContext: surrealTestResult.additionalContext })
      );
    }
  }

  // --- Guard 7b: SurrealDB skill injection (advisory, non-blocking) ---
  if (
    (command &&
      /surreal|surrealdb|surql|localhost:800[0-9]/i.test(command)) ||
    (filePath && /surreal|\.surql$/i.test(filePath))
  ) {
    const result = await guardSurrealdbInject(filePath, command);
    if (result.additionalContext) {
      // Output as JSON for Claude Code to pick up
      console.log(
        JSON.stringify({ additionalContext: result.additionalContext })
      );
    }
  }

  // --- Guard 8: Lessons injection (advisory, once per session) ---
  const lessonsResult = await guardLessonsInject(process.cwd());
  if (lessonsResult.additionalContext) {
    console.log(
      JSON.stringify({ additionalContext: lessonsResult.additionalContext })
    );
  }

  process.exit(0);
}

main();
