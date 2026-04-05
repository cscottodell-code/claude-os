#!/usr/bin/env bun
/**
 * pre-completion-checklist.ts — Stop hook: structural enforcement of
 * verification rules before session ends.
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { exec } from "../src/exec.js";
import { fileMtime, now } from "./lib/platform.js";

const cwd = process.cwd();
const checks: string[] = [];

// 1. Uncommitted changes
const status = await exec("git status --porcelain", { cwd, timeout: 5000 });
if (status.ok && status.stdout.trim()) {
  checks.push("Uncommitted changes detected — commit or stash before leaving");
}

// 2. tasks/todo.md freshness
const todoPath = resolve(cwd, "tasks/todo.md");
if (existsSync(todoPath)) {
  const mtime = fileMtime(todoPath);
  if (mtime) {
    const hoursOld = (now() - mtime) / 3600;
    if (hoursOld > 2) {
      checks.push(
        `tasks/todo.md last modified ${Math.round(hoursOld)}h ago — update before leaving`
      );
    }
  }
}

// 3. Resume file
const resumePath = resolve(cwd, ".claude-resume.md");
if (!existsSync(resumePath)) {
  checks.push(
    ".claude-resume.md missing — write one so next session can pick up"
  );
}

// 4. tasks/lessons.md freshness
const lessonsPath = resolve(cwd, "tasks/lessons.md");
if (existsSync(lessonsPath)) {
  const mtime = fileMtime(lessonsPath);
  if (mtime) {
    const hoursOld = (now() - mtime) / 3600;
    if (hoursOld > 4) {
      checks.push(
        `tasks/lessons.md last modified ${Math.round(hoursOld)}h ago — capture any learnings`
      );
    }
  }
}

// 5. Recent fix commits (may need lessons capture)
const fixCommits = await exec(
  'git log --since="2 hours ago" --oneline --grep="fix\\|bug\\|debug\\|error\\|crash\\|hotfix" 2>/dev/null',
  { cwd, timeout: 5000 }
);
if (fixCommits.ok && fixCommits.stdout.trim()) {
  checks.push(
    "Recent fix commits detected — ensure lessons captured in tasks/lessons.md"
  );
}

// 6. Recent milestone/phase commits
const milestoneCommits = await exec(
  'git log --since="2 hours ago" --oneline --grep="milestone\\|phase\\|complete\\|ship\\|release" 2>/dev/null',
  { cwd, timeout: 5000 }
);
if (milestoneCommits.ok && milestoneCommits.stdout.trim()) {
  checks.push(
    "Phase/milestone commit detected — ensure /scott:phase-closeout was run"
  );
}

if (checks.length > 0) {
  console.log(`\n--- Pre-Completion Checklist (${checks.length} items) ---`);
  for (const c of checks) console.log(`  [ ] ${c}`);
  console.log("---\n");
}

process.exit(0);
