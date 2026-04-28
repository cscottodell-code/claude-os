#!/usr/bin/env bun
/**
 * Guard: Block modifications to CLAUDE.md and MEMORY.md files.
 * Standalone hook registered under PreToolUse Edit|Write matcher.
 *
 * Bypass: Scott can authorize a one-off edit by creating a marker file at
 * ~/.claude/.allow-behavior-edit. The marker is consumed (deleted) after a
 * single allowed edit, so it cannot drift past one use without re-auth.
 */

import { existsSync, unlinkSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";

import { readStdin, getFilePath } from "../lib/stdin.js";

const BYPASS_MARKER = resolve(homedir(), ".claude/.allow-behavior-edit");

async function main() {
  const result = await readStdin();

  // Fail closed: if we received data but couldn't parse it, block
  if (!result.ok) {
    console.log("guard-claude-md: stdin parse failed — blocking (fail-closed).");
    process.exit(2);
  }

  const input = result.input;
  if (!input) process.exit(0);

  // Only check Edit and Write tools
  const tool = input.tool_name;
  if (tool !== "Edit" && tool !== "Write") process.exit(0);

  const filePath = getFilePath(input);
  if (!filePath) process.exit(0);

  if (/(?:CLAUDE|MEMORY)\.md$/i.test(filePath)) {
    if (existsSync(BYPASS_MARKER)) {
      try {
        unlinkSync(BYPASS_MARKER);
      } catch {
        // If we cannot delete the marker, fail safe by blocking.
        console.log(
          "guard-claude-md: bypass marker present but could not be consumed. Blocking."
        );
        process.exit(2);
      }
      console.log(
        `guard-claude-md: edit allowed by single-use bypass marker (${filePath}). Marker consumed.`
      );
      process.exit(0);
    }
    console.log(
      "CLAUDE.md/MEMORY.md modification blocked. Tell Scott what you want to change and why. To authorize a one-off edit: touch ~/.claude/.allow-behavior-edit (consumed on first allowed edit)."
    );
    process.exit(2);
  }

  process.exit(0);
}

main();
