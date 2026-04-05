#!/usr/bin/env bun
/**
 * uiux-reminder.ts — PostToolUse nudge for .vue file edits.
 * Fires at most once per phase per project.
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { readStdin, getFilePath } from "./lib/stdin.js";
import { shortHash } from "./lib/platform.js";

const input = await readStdin();
if (!input) process.exit(0);

const filePath = getFilePath(input);
if (!filePath || !filePath.endsWith(".vue")) process.exit(0);

// Only in GSD projects
if (!existsSync(resolve(process.cwd(), ".planning"))) process.exit(0);

// Dedup: one reminder per project per phase
const marker = `/tmp/uiux-reminder-${shortHash(process.cwd())}`;
if (existsSync(marker)) process.exit(0);

await Bun.write(marker, "");
console.log(
  "UI/UX nudge: .vue file edited. Consider running /impeccable:audit before closeout."
);

process.exit(0);
