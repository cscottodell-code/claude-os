#!/usr/bin/env bun
/**
 * toolkit-coherence-check.ts — PostToolUse: validate cross-references
 * when toolkit files are modified.
 */

import { readFileSync } from "fs";
import { readStdin, getFilePath } from "./lib/stdin.js";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";

const input = await readStdin();
if (!input) process.exit(0);

const filePath = getFilePath(input);
if (!filePath || !filePath.includes("scott-toolkit")) process.exit(0);

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
        `  "${entry.pattern}" — ${entry.reason}\n  Replace with: ${entry.replacement}`
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
