#!/usr/bin/env bun
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
import { readStdin, getCommand, getFilePath, stripQuoted } from "./lib/stdin.js";
// guardGitPush retired in v6.2.1 — Claude Code's permission prompt is the safety net
import { guardDestructive } from "./guards/destructive.js";
import { guardNpmInstall } from "./guards/npm-install.js";
import { guardPhaseCompletion } from "./guards/phase-completion.js";
import { guardSurrealdbInject } from "./guards/surrealdb-inject.js";
import { guardLessonsInject } from "./guards/lessons-inject.js";
import {
  guardProjectScaffolded,
  guardDesignApproved,
  guardChangesDrafted,
  guardReflectionComplete,
} from "./guards/workflow-gates.js";

async function main() {
  const stdinResult = await readStdin();

  // Fail closed: if we received data but couldn't parse it, block
  if (!stdinResult.ok) {
    console.log(
      "pretooluse-router: stdin parse failed — blocking (fail-closed)."
    );
    process.exit(2);
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
      if (result.message) console.log(result.message);
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
      if (result.message) console.log(result.message);
      process.exit(2);
    }
  }

  // --- Guard 4: phase completion ---
  if (command && /phase.*(complete|done|finish)/.test(command)) {
    const result = guardPhaseCompletion(command);
    if (!result.allow) {
      if (result.message) console.log(result.message);
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
      const proc = Bun.spawn(["bash", gsdHook], {
        stdin: new Blob([rawInput]),
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      if (exitCode !== 0) {
        const stdout = await new Response(proc.stdout).text();
        if (stdout.trim()) console.log(stdout.trim());
        process.exit(exitCode);
      }
    } catch {
      // GSD hook not available, allow
    }
  }

  // --- Guard 6: Workflow gates (advisory by default) ---
  // Detect marker file writes (touch .project-scaffolded, etc.) and workflow phase transitions.
  // Gates check that prerequisite phases completed before allowing later phases.
  if (command) {
    const cwd = process.cwd();
    const gates = [
      { pattern: /design.proof|phase.6|impeccable.*teach/i, fn: () => guardProjectScaffolded(cwd) },
      { pattern: /build.milestone|phase.7|gsd.*execute/i, fn: () => guardDesignApproved(cwd) },
      { pattern: /phase.4.*toolkit|update.changelog.*phase/i, fn: () => guardChangesDrafted(cwd) },
      { pattern: /generate.retro|phase.3.*retro/i, fn: () => guardReflectionComplete(cwd) },
    ];

    for (const g of gates) {
      if (g.pattern.test(command) || g.pattern.test(rawInput)) {
        const result = g.fn();
        if (result.message) console.log(result.message);
        if (!result.allow) process.exit(2);
      }
    }
  }

  // --- Guard 7: SurrealDB skill injection (advisory, non-blocking) ---
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
