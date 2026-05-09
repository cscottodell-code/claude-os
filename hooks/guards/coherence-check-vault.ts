#!/usr/bin/env bun
/**
 * coherence-check-vault.ts: PostToolUse hook that validates cross-references
 * when growth-os vault files are modified. Reads banned patterns from
 * config/banned-patterns.json filtered by scope vault|both. Companion to
 * hooks/toolkit-coherence-check.ts (which handles harness scope).
 *
 * Advisory only; never blocks. Output reaches the orchestrator via stdout
 * for visibility on stale references introduced into vault content.
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";

import { readStdinSimple, getFilePath } from "../lib/stdin.js";

const CONFIG_PATH = resolve(homedir(), "Scott/claude-os/config/banned-patterns.json");

interface BannedEntry {
  pattern: string;
  reason: string;
  replacement: string;
  scope: "harness" | "vault" | "both";
}

interface BannedPatternsConfig {
  banned?: BannedEntry[];
}

const input = await readStdinSimple();
if (!input) process.exit(0);

const filePath = getFilePath(input);
if (!filePath || !filePath.includes("growth-os")) process.exit(0);

let config: BannedPatternsConfig;
try {
  config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as BannedPatternsConfig;
} catch {
  process.exit(0);
}

const banned = (config.banned ?? []).filter(
  (entry) => entry.scope === "vault" || entry.scope === "both"
);
if (banned.length === 0) process.exit(0);

try {
  const content = readFileSync(filePath, "utf-8");
  const warnings: string[] = [];
  for (const entry of banned) {
    if (content.includes(entry.pattern)) {
      warnings.push(
        `  "${entry.pattern}": ${entry.reason}\n  Replace with: ${entry.replacement}`
      );
    }
  }
  if (warnings.length > 0) {
    console.log(
      `\nVault coherence: ${warnings.length} banned pattern(s) in edited file:\n`
    );
    console.log(warnings.join("\n\n"));
    console.log("");
  }
} catch {
  // File not readable, skip
}

process.exit(0);
