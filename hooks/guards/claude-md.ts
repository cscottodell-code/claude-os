#!/usr/bin/env bun
/**
 * Guard: Block modifications to CLAUDE.md and MEMORY.md files.
 * Standalone hook registered under PreToolUse Edit|Write matcher.
 */

import { readStdin, getFilePath } from "../lib/stdin.js";

async function main() {
  const input = await readStdin();
  if (!input) process.exit(0);

  // Only check Edit and Write tools
  const tool = input.tool_name;
  if (tool !== "Edit" && tool !== "Write") process.exit(0);

  const filePath = getFilePath(input);
  if (!filePath) process.exit(0);

  if (/(?:CLAUDE|MEMORY)\.md$/i.test(filePath)) {
    console.log(
      "CLAUDE.md/MEMORY.md modification blocked — tell Scott what you want to change and why before editing."
    );
    process.exit(2);
  }

  process.exit(0);
}

main();
