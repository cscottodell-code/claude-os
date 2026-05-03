#!/usr/bin/env bun
/**
 * toolkit-coherence-check.ts: PostToolUse hook that validates cross-references
 * when toolkit files are modified. Reads banned patterns from
 * config/version-manifest.json and warns on any matches in the edited file.
 */

import { readFileSync } from "fs";
import { readStdinSimple, getFilePath } from "./lib/stdin.js";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";

const input = await readStdinSimple();
if (!input) process.exit(0);

const filePath = getFilePath(input);
if (!filePath || !filePath.includes("claude-os")) process.exit(0);

interface Manifest {
  cross_reference_patterns?: {
    banned?: Array<{
      pattern: string;
      reason: string;
      replacement: string;
    }>;
  };
}

const manifest = await readJson<Manifest>(
  toolkitPath("config", "version-manifest.json")
);

const banned = manifest?.cross_reference_patterns?.banned;
if (!banned || banned.length === 0) process.exit(0);

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
      `\nToolkit coherence: ${warnings.length} banned pattern(s) in edited file:\n`
    );
    console.log(warnings.join("\n\n"));
    console.log("");
  }
} catch {
  // File not readable, skip
}

process.exit(0);
