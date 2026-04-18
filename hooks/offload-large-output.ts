#!/usr/bin/env node --experimental-strip-types --no-warnings
/**
 * offload-large-output.ts — PostToolUse: detect tool results >4KB
 * and write them to overflow files for post-compaction recovery.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { readStdin } from "./lib/stdin.ts";
import { timestampStr } from "./lib/platform.ts";

const THRESHOLD = 4096;
const OVERFLOW_DIR = resolve(homedir(), ".claude/tool-output-overflow");

const input = await readStdin();
if (!input) process.exit(0);

const output = input.tool_output;
if (!output) process.exit(0);

const size = Buffer.byteLength(output, "utf-8");
if (size < THRESHOLD) process.exit(0);

// Ensure overflow directory exists
if (!existsSync(OVERFLOW_DIR)) {
  mkdirSync(OVERFLOW_DIR, { recursive: true });
}

const toolName = input.tool_name ?? "unknown";
const filename = `${toolName}-${timestampStr()}.md`;
const filepath = resolve(OVERFLOW_DIR, filename);

writeFileSync(filepath, output);

console.log(
  `Large output (${(size / 1024).toFixed(1)}KB) saved to: ${filepath}`
);

process.exit(0);
