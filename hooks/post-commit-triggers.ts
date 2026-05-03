#!/usr/bin/env node --experimental-strip-types --no-warnings
/**
 * post-commit-triggers.ts — PostToolUse: suggest skills after git commits.
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { readStdin, getCommand, stripQuoted } from "./lib/stdin.ts";
import { exec } from "../src/exec.ts";

const input = await readStdin();
if (!input) process.exit(0);

const command = getCommand(input);
if (!command) process.exit(0);

const stripped = stripQuoted(command);
if (!/(?:^|\s|&&|\|)git\s+commit/.test(stripped)) process.exit(0);

// Get the latest commit message
const result = await exec("git log -1 --pretty=%B", { timeout: 5000 });
if (!result.ok || !result.stdout) process.exit(0);

const message = result.stdout.toLowerCase();
const triggers: string[] = [];

// Bug fix detection
if (/fix|bug|debug|error|crash|broke|broken|hotfix|patch/.test(message)) {
  triggers.push(
    "Bug fix committed. Consider: capture lessons in tasks/lessons.md"
  );
}

// Phase/milestone completion detection
if (
  /milestone|phase|complete|finish|ship|release|v\d/.test(message)
) {
  // Check for recent VERIFICATION.md
  const hasVerification = await exec(
    'find . -name VERIFICATION.md -mmin -10 2>/dev/null',
    { timeout: 5000 }
  );

  if (hasVerification.stdout) {
    triggers.push(
      "Phase completion detected. Run /scott:phase-closeout if not already done."
    );
  }
}

// Fallback: suggest success logging
if (triggers.length === 0) {
  const planningExists = existsSync(
    resolve(process.cwd(), ".planning")
  );
  if (planningExists) {
    triggers.push(
      "Commit in GSD project. Log successes in ~/Scott/claude-os/successes/"
    );
  }
}

if (triggers.length > 0) {
  console.log("\n--- Post-Commit ---");
  for (const t of triggers) console.log(`  ${t}`);
  console.log("---\n");
}

process.exit(0);
