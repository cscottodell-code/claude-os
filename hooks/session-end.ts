#!/usr/bin/env bun
/**
 * session-end.ts — Stop hook: remind to update resume file and docs.
 */

import { existsSync } from "fs";
import { resolve } from "path";

const claudeMd = resolve(process.cwd(), "CLAUDE.md");

if (existsSync(claudeMd)) {
  console.log(`
Session ending — please verify:
  [ ] .claude-resume.md is up to date (so next session can pick up)
  [ ] CLAUDE.md status section is current
  [ ] Completed tasks are checked off in tasks/todo.md
`);
}

process.exit(0);
