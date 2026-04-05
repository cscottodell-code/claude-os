#!/usr/bin/env bun
/**
 * extract-instincts.ts — PreCompact + Stop hook.
 * Prompts Claude to capture session patterns for later review.
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

const instinctsFile = resolve(homedir(), ".claude/instinct-candidates.md");

// Create file if missing
if (!existsSync(instinctsFile)) {
  await Bun.write(instinctsFile, "# Instinct Candidates\n\nCapture session patterns here.\n\n");
}

console.log(`
Before this session ends, capture any patterns worth remembering:

  - [ ] Strategies that worked well (worth repeating)
  - [ ] Mistakes or friction points (worth avoiding)
  - [ ] Surprising discoveries about the codebase
  - [ ] Workflow improvements to consider

Append findings to: ~/.claude/instinct-candidates.md
`);

process.exit(0);
