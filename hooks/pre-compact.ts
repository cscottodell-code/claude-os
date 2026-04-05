#!/usr/bin/env bun
/**
 * pre-compact.ts — PreCompact hook: capture context before compaction.
 * 1. Prompts Claude to write .claude-resume.md
 * 2. Writes mechanical .context-snapshot.md backup
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { exec } from "../src/exec.js";
import { dateStr } from "./lib/platform.js";

const cwd = process.cwd();
const claudeMd = resolve(cwd, "CLAUDE.md");

if (!existsSync(claudeMd)) process.exit(0);

// Build context snapshot
const sections: string[] = [];
sections.push(`# Context Snapshot — ${dateStr()}\n`);
sections.push(`Working directory: ${cwd}\n`);

// Pending tasks
const todoFile = resolve(cwd, "tasks/todo.md");
if (existsSync(todoFile)) {
  const content = readFileSync(todoFile, "utf-8");
  const pending = content
    .split("\n")
    .filter((l) => l.match(/^- \[ \]/))
    .slice(0, 10);
  if (pending.length > 0) {
    sections.push("## Pending Tasks\n");
    sections.push(pending.join("\n"));
    sections.push("");
  }
}

// Git state
const branch = await exec("git branch --show-current", { cwd });
const log = await exec("git log --oneline -5", { cwd });
const status = await exec("git status --short", { cwd });

sections.push("## Git State\n");
sections.push(`Branch: ${branch.stdout}`);
sections.push(`\nRecent commits:\n${log.stdout}`);
if (status.stdout) {
  sections.push(`\nUncommitted changes:\n${status.stdout}`);
}

// GSD state
const stateFile = resolve(cwd, ".planning/STATE.md");
if (existsSync(stateFile)) {
  sections.push("\n## GSD State\n");
  sections.push(readFileSync(stateFile, "utf-8").slice(0, 500));
}

// Write snapshot
const snapshotPath = resolve(cwd, ".context-snapshot.md");
await Bun.write(snapshotPath, sections.join("\n") + "\n");

// Prompt Claude to write the resume file
console.log(`
--- Pre-Compaction ---
Context snapshot saved to .context-snapshot.md

IMPORTANT: Before compaction, write .claude-resume.md with:
  1. What you were working on
  2. What's done, what's pending
  3. Key decisions made
  4. Next steps

This is your handoff to the post-compaction context.
---
`);

process.exit(0);
